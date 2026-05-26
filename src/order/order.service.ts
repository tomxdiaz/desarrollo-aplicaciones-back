import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { Tables } from '../supabase/database.types';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderDto } from './dto/order.dto';
import { RestaurantOrderStatus } from '../utils/enums/restaurant-order-status';

type RestaurantOrder = Tables<'restaurant_order'>;
type OrderItem = Tables<'order_item'>;
type Restaurant = Tables<'restaurant'>;
type Product = Tables<'product'>;

type ProductForOrder = Pick<
  Product,
  'id' | 'name' | 'description' | 'image' | 'price' | 'active'
> & {
  category: {
    id: number;
    active: boolean;
    menu: {
      id: number;
      restaurant_id: number;
    };
  };
};

const VALID_TRANSITIONS: Record<
  RestaurantOrderStatus,
  RestaurantOrderStatus[]
> = {
  PENDING: ['IN_PROCESS', 'CANCELLED'],
  IN_PROCESS: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(
    userId: string,
    restaurantId: number,
    dto: CreateOrderDto,
  ): Promise<OrderDto> {
    const supabase = this.supabaseService.getAdminClient();

    if (!dto.table_code || restaurantId == null) {
      throw new BadRequestException('Se requiere table_code y restaurantId');
    }

    if (!dto.items?.length) {
      throw new BadRequestException(
        'El pedido debe tener al menos un producto',
      );
    }

    for (const item of dto.items) {
      if (!item.product_id) {
        throw new BadRequestException('Cada item debe tener un producto');
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new BadRequestException(
          'La cantidad de cada producto debe ser mayor a cero',
        );
      }
    }

    const { data: table, error: tableError } = await supabase
      .from('restaurant_table')
      .select('id, restaurant_id')
      .eq('code', dto.table_code)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (tableError) {
      this.logger.error(
        `Error finding restaurant_table code=${dto.table_code} restaurant_id=${restaurantId}: ${tableError.message}`,
      );

      if (this.isBadRequestDatabaseError(tableError)) {
        throw new BadRequestException('Datos inválidos para crear el pedido');
      }

      throw new InternalServerErrorException(
        'Error inesperado al obtener la mesa',
      );
    }

    if (!table) {
      throw new NotFoundException('Mesa no encontrada');
    }

    const productIds = [...new Set(dto.items.map((i) => i.product_id))];

    const { data: products, error: productsError } = await supabase
      .from('product')
      .select(
        `
        id,
        name,
        description,
        image,
        price,
        active,
        category!inner(
          id,
          active,
          menu!inner(
            id,
            restaurant_id
          )
        )
      `,
      )
      .in('id', productIds)
      .eq('active', true)
      .eq('category.active', true);

    if (productsError) {
      this.logger.error(
        `Error finding products for order. productIds=${JSON.stringify(productIds)} restaurant_id=${table.restaurant_id} error=${productsError.message}`,
      );

      if (this.isBadRequestDatabaseError(productsError)) {
        throw new BadRequestException('Datos inválidos para crear el pedido');
      }

      throw new InternalServerErrorException(
        'Error inesperado al obtener los productos',
      );
    }

    const productsForOrder = products as ProductForOrder[];

    const productMap = new Map<number, ProductForOrder>(
      productsForOrder.map((product) => [product.id, product]),
    );

    for (const item of dto.items) {
      const product = productMap.get(item.product_id);

      if (!product) {
        this.logger.warn(
          `Requested product id ${item.product_id} not returned from DB. availableProductIds=${JSON.stringify(
            Array.from(productMap.keys()),
          )}`,
        );

        throw new NotFoundException(
          `Producto con id ${item.product_id} no encontrado o no pertenece al restaurante`,
        );
      }

      if (product.category.menu.restaurant_id !== table.restaurant_id) {
        throw new BadRequestException(
          `El producto con id ${item.product_id} no pertenece al restaurante de la mesa`,
        );
      }
    }

    const { count, error: countError } = await supabase
      .from('restaurant_order')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', table.restaurant_id);

    if (countError) {
      this.logger.error(
        `Error counting orders for restaurant_id ${table.restaurant_id}: ${countError.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al calcular el número del pedido',
      );
    }

    const total = dto.items.reduce((sum, item) => {
      const product = productMap.get(item.product_id)!;
      const unitPrice = Number(product.price);

      return sum + unitPrice * item.quantity;
    }, 0);

    const { data: order, error: orderError } = await supabase
      .from('restaurant_order')
      .insert({
        restaurant_id: table.restaurant_id,
        table_id: table.id,
        user_id: userId,
        number: (count ?? 0) + 1,
        status: RestaurantOrderStatus.PENDING,
        total,
        note: dto.note,
      })
      .select()
      .single();

    if (orderError) {
      this.logger.error(`Error creating order: ${orderError.message}`);

      if (this.isForeignKeyViolation(orderError)) {
        throw new NotFoundException(
          'Restaurante, mesa o usuario relacionado no encontrado',
        );
      }

      if (this.isBadRequestDatabaseError(orderError)) {
        throw new BadRequestException('Datos inválidos para crear el pedido');
      }

      throw new InternalServerErrorException(
        'Error inesperado al crear el pedido',
      );
    }

    const itemsToInsert = dto.items.map((item) => {
      const product = productMap.get(item.product_id)!;
      const unitPrice = Number(product.price);

      return {
        order_id: order.id,

        product_id: product.id,
        product_name: product.name,
        product_description: product.description,
        product_image: product.image,
        unit_price: unitPrice,

        quantity: item.quantity,
        subtotal: unitPrice * item.quantity,
      };
    });

    const { data: items, error: itemsError } = await supabase
      .from('order_item')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      this.logger.error(
        `Error creating order items for order_id ${order.id}: ${itemsError.message}`,
      );

      if (this.isForeignKeyViolation(itemsError)) {
        throw new NotFoundException('Pedido relacionado no encontrado');
      }

      if (this.isBadRequestDatabaseError(itemsError)) {
        throw new BadRequestException('Datos inválidos para crear el pedido');
      }

      throw new InternalServerErrorException(
        'Error inesperado al crear los items del pedido',
      );
    }

    return this.toOrderDto(order, items ?? []);
  }

  async findMine(userId: string): Promise<OrderDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: orders, error } = await supabase
      .from('restaurant_order')
      .select(
        '*, order_item(*), restaurant(id, name, owner_id, description, address)',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(
        `Error finding orders for user_id ${userId}: ${error.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al obtener los pedidos',
      );
    }

    return (orders ?? []).map((o) =>
      this.toOrderDto(o, o.order_item ?? [], o.restaurant ?? undefined),
    );
  }

  async findMineById(userId: string, orderId: number): Promise<OrderDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: order, error } = await supabase
      .from('restaurant_order')
      .select('*, order_item(*)')
      .eq('user_id', userId)
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Error finding order_id ${orderId} for user_id ${userId}: ${error.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al obtener el pedido',
      );
    }

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return this.toOrderDto(order, order.order_item ?? []);
  }

  async cancelMine(userId: string, orderId: number): Promise<OrderDto> {
    return await this.updateMineStatus(
      userId,
      orderId,
      RestaurantOrderStatus.CANCELLED,
    );
  }

  async findByRestaurant(restaurantId: number): Promise<OrderDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    await this.ensureRestaurantExists(restaurantId);

    const { data: orders, error } = await supabase
      .from('restaurant_order')
      .select('*, order_item(*)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(
        `Error finding orders for restaurant_id ${restaurantId}: ${error.message}`,
      );

      if (this.isBadRequestDatabaseError(error)) {
        throw new BadRequestException('restaurantId inválido');
      }

      throw new InternalServerErrorException(
        'Error inesperado al obtener los pedidos del restaurante',
      );
    }

    return (orders ?? []).map((o) => this.toOrderDto(o, o.order_item ?? []));
  }

  async updateStatus(
    restaurantId: number,
    orderId: number,
    newStatus: RestaurantOrderStatus,
  ): Promise<OrderDto> {
    const supabase = this.supabaseService.getAdminClient();

    if (!newStatus) {
      throw new BadRequestException('El estado del pedido es requerido');
    }

    if (!Object.values(RestaurantOrderStatus).includes(newStatus)) {
      throw new BadRequestException('Estado de pedido inválido');
    }

    const { data: order, error: orderError } = await supabase
      .from('restaurant_order')
      .select('*')
      .eq('id', orderId)
      .eq('restaurant_id', restaurantId)
      .maybeSingle();

    if (orderError) {
      this.logger.error(
        `Error finding order_id ${orderId} for restaurant_id ${restaurantId}: ${orderError.message}`,
      );

      if (this.isBadRequestDatabaseError(orderError)) {
        throw new BadRequestException('orderId o restaurantId inválido');
      }

      throw new InternalServerErrorException(
        'Error inesperado al obtener el pedido',
      );
    }

    if (!order) {
      throw new NotFoundException('Pedido no encontrado para este restaurante');
    }

    const validNext = VALID_TRANSITIONS[order.status];

    if (!validNext.includes(newStatus)) {
      const options = validNext.length ? validNext.join(', ') : 'none';

      throw new BadRequestException(
        `No se puede cambiar el estado de ${order.status} a ${newStatus}. Estados válidos siguientes: ${options}`,
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('restaurant_order')
      .update({ status: newStatus })
      .eq('id', orderId)
      .eq('restaurant_id', restaurantId)
      .select()
      .maybeSingle();

    if (updateError) {
      this.logger.error(
        `Error updating status for order_id ${orderId} and restaurant_id ${restaurantId}: ${updateError.message}`,
      );

      if (this.isBadRequestDatabaseError(updateError)) {
        throw new BadRequestException('Estado de pedido inválido');
      }

      throw new InternalServerErrorException(
        'Error inesperado al actualizar el estado del pedido',
      );
    }

    if (!updated) {
      throw new NotFoundException('Pedido no encontrado para este restaurante');
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_item')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      this.logger.error(
        `Error finding order items for order_id ${orderId}: ${itemsError.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al obtener los items del pedido',
      );
    }

    return this.toOrderDto(updated, items ?? []);
  }

  private async updateMineStatus(
    userId: string,
    orderId: number,
    newStatus: RestaurantOrderStatus,
  ): Promise<OrderDto> {
    const supabase = this.supabaseService.getAdminClient();

    if (!newStatus) {
      throw new BadRequestException('El estado del pedido es requerido');
    }

    if (!Object.values(RestaurantOrderStatus).includes(newStatus)) {
      throw new BadRequestException('Estado de pedido inválido');
    }

    const { data: order, error: orderError } = await supabase
      .from('restaurant_order')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .maybeSingle();

    if (orderError) {
      this.logger.error(
        `Error finding order_id ${orderId} for user_id ${userId}: ${orderError.message}`,
      );

      if (this.isBadRequestDatabaseError(orderError)) {
        throw new BadRequestException('orderId inválido');
      }

      throw new InternalServerErrorException(
        'Error inesperado al obtener el pedido',
      );
    }

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const validNext = VALID_TRANSITIONS[order.status];

    if (!validNext.includes(newStatus)) {
      const options = validNext.length ? validNext.join(', ') : 'none';

      throw new BadRequestException(
        `No se puede cambiar el estado de ${order.status} a ${newStatus}. Estados válidos siguientes: ${options}`,
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('restaurant_order')
      .update({ status: newStatus })
      .eq('id', orderId)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (updateError) {
      this.logger.error(
        `Error updating status for order_id ${orderId} and user_id ${userId}: ${updateError.message}`,
      );

      if (this.isBadRequestDatabaseError(updateError)) {
        throw new BadRequestException('Estado de pedido inválido');
      }

      throw new InternalServerErrorException(
        'Error inesperado al actualizar el estado del pedido',
      );
    }

    if (!updated) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_item')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      this.logger.error(
        `Error finding order items for order_id ${orderId}: ${itemsError.message}`,
      );

      throw new InternalServerErrorException(
        'Error inesperado al obtener los items del pedido',
      );
    }

    return this.toOrderDto(updated, items ?? []);
  }

  private async ensureRestaurantExists(restaurantId: number): Promise<void> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('restaurant')
      .select('id')
      .eq('id', restaurantId)
      .maybeSingle();

    if (error) {
      this.logger.error(
        `Error finding restaurant_id ${restaurantId}: ${error.message}`,
      );

      if (this.isBadRequestDatabaseError(error)) {
        throw new BadRequestException('restaurantId inválido');
      }

      throw new InternalServerErrorException(
        'Error inesperado al obtener el restaurante',
      );
    }

    if (!data) {
      throw new NotFoundException('Restaurante no encontrado');
    }
  }

  private toOrderDto(
    order: RestaurantOrder,
    items: OrderItem[],
    restaurant?: Restaurant,
  ): OrderDto {
    return {
      id: order.id,
      restaurant_id: order.restaurant_id,
      table_id: order.table_id,
      user_id: order.user_id,
      number: order.number,
      status: order.status,
      total: order.total,
      created_at: order.created_at,
      items: items.map((i) => ({
        id: i.id,
        order_id: i.order_id,

        product_id: i.product_id,
        product_name: i.product_name,
        product_description: i.product_description,
        product_image: i.product_image,
        unit_price: i.unit_price,

        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      ...(restaurant ? { restaurant: this.toRestaurantDto(restaurant) } : {}),
      note: order.note,
    };
  }

  private toRestaurantDto(restaurant: Restaurant): OrderDto['restaurant'] {
    return {
      id: restaurant.id,
      name: restaurant.name,
      owner_id: restaurant.owner_id,
      description: restaurant.description,
      address: restaurant.address,
    };
  }

  private isForeignKeyViolation(error: { code?: string }): boolean {
    return error.code === '23503';
  }

  private isBadRequestDatabaseError(error: {
    code?: string;
    message?: string;
  }): boolean {
    const message = error.message?.toLowerCase() ?? '';

    return (
      error.code === '22P02' || // invalid_text_representation
      error.code === '23502' || // not_null_violation
      error.code === '23505' || // unique_violation
      error.code === '23514' || // check_violation
      message.includes('invalid input syntax')
    );
  }
}

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { Tables } from '../supabase/database.types';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderDto } from './dto/order.dto';
import { RestaurantOrderStatus } from '../utils/enums/restaurant-order-status';

type RestaurantOrder = Tables<'restaurant_order'>;
type OrderItem = Tables<'order_item'>;
type AppUser = Tables<'app_user'>;

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
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, dto: CreateOrderDto): Promise<OrderDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: table, error: tableError } = await supabase
      .from('restaurant_table')
      .select('id, restaurant_id')
      .eq('id', dto.table_id)
      .maybeSingle();

    if (tableError) throw new InternalServerErrorException(tableError.message);
    if (!table)
      throw new NotFoundException(`Table with id ${dto.table_id} not found`);

    const productIds = dto.items.map((i) => i.product_id);
    const { data: products, error: productsError } = await supabase
      .from('product')
      .select('id, price')
      .in('id', productIds);

    if (productsError)
      throw new InternalServerErrorException(productsError.message);

    const productMap = new Map((products ?? []).map((p) => [p.id, p.price]));
    for (const item of dto.items) {
      if (!productMap.has(item.product_id)) {
        throw new BadRequestException(
          `Product with id ${item.product_id} not found`,
        );
      }
    }

    const { count, error: countError } = await supabase
      .from('restaurant_order')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', table.restaurant_id);

    if (countError) throw new InternalServerErrorException(countError.message);

    const total = dto.items.reduce(
      (sum, item) => sum + productMap.get(item.product_id)! * item.quantity,
      0,
    );

    const { data: order, error: orderError } = await supabase
      .from('restaurant_order')
      .insert({
        restaurant_id: table.restaurant_id,
        table_id: dto.table_id,
        user_id: userId,
        number: (count ?? 0) + 1,
        status: RestaurantOrderStatus.PENDING,
        total,
      })
      .select()
      .single();

    if (orderError) throw new InternalServerErrorException(orderError.message);

    const itemsToInsert = dto.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      subtotal: productMap.get(item.product_id)! * item.quantity,
    }));

    const { data: items, error: itemsError } = await supabase
      .from('order_item')
      .insert(itemsToInsert)
      .select();

    if (itemsError) throw new InternalServerErrorException(itemsError.message);

    return this.toOrderDto(order, items ?? []);
  }

  async findMine(userId: string): Promise<OrderDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: orders, error } = await supabase
      .from('restaurant_order')
      .select('*, order_item(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);

    return (orders ?? []).map((o) => this.toOrderDto(o, o.order_item ?? []));
  }

  async findByRestaurant(restaurantId: number): Promise<OrderDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: orders, error } = await supabase
      .from('restaurant_order')
      .select('*, order_item(*)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);

    return (orders ?? []).map((o) => this.toOrderDto(o, o.order_item ?? []));
  }

  async updateStatus(
    orderId: number,
    appUser: AppUser,
    newStatus: RestaurantOrderStatus,
  ): Promise<OrderDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: order, error: orderError } = await supabase
      .from('restaurant_order')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) throw new InternalServerErrorException(orderError.message);

    if (!order)
      throw new NotFoundException(`Order with id ${orderId} not found`);

    const validNext = VALID_TRANSITIONS[order.status];
    if (!validNext.includes(newStatus)) {
      const options = validNext.length ? validNext.join(', ') : 'none';
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${newStatus}. Valid next statuses: ${options}`,
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('restaurant_order')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError)
      throw new InternalServerErrorException(updateError.message);

    const { data: items, error: itemsError } = await supabase
      .from('order_item')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) throw new InternalServerErrorException(itemsError.message);

    return this.toOrderDto(updated, items ?? []);
  }

  private toOrderDto(order: RestaurantOrder, items: OrderItem[]): OrderDto {
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
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
    };
  }
}

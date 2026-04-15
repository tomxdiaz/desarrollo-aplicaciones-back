import { Test, TestingModule } from '@nestjs/testing';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableStatusDto } from './dto/update-table-status.dto';
import { TableDto } from './dto/table.dto';

const mockTable: TableDto = {
  id: 5,
  restaurant_id: 1,
  code: '1A',
  area: 'Main Floor',
  capacity: 4,
  status: 'FREE',
};

describe('TableController', () => {
  let controller: TableController;
  let tableService: {
    findAllByRestaurant: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
    updateStatus: jest.Mock;
  };

  beforeEach(async () => {
    tableService = {
      findAllByRestaurant: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TableController],
      providers: [
        {
          provide: TableService,
          useValue: tableService,
        },
        // SupabaseAuthGuard injects SupabaseService; it must be provided even
        // though guards are not executed when calling controller methods directly.
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TableController>(TableController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call tableService.findAllByRestaurant with the restaurantId', async () => {
      tableService.findAllByRestaurant.mockResolvedValue([mockTable]);

      await controller.findAll(1);

      expect(tableService.findAllByRestaurant).toHaveBeenCalledWith(1);
    });

    it('should return the array of tables from the service', async () => {
      tableService.findAllByRestaurant.mockResolvedValue([mockTable]);

      const result = await controller.findAll(1);

      expect(result).toEqual([mockTable]);
    });

    it('should return an empty array when the restaurant has no tables', async () => {
      tableService.findAllByRestaurant.mockResolvedValue([]);

      const result = await controller.findAll(1);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    const createTableDto: CreateTableDto = {
      code: '1A',
      area: 'Main Floor',
      capacity: 4,
    };

    it('should call tableService.create with restaurantId and dto', async () => {
      tableService.create.mockResolvedValue(mockTable);

      await controller.create(1, createTableDto);

      expect(tableService.create).toHaveBeenCalledWith(1, createTableDto);
    });

    it('should return the created table', async () => {
      tableService.create.mockResolvedValue(mockTable);

      const result = await controller.create(1, createTableDto);

      expect(result).toEqual(mockTable);
    });
  });

  describe('delete', () => {
    it('should call tableService.delete with restaurantId and tableId', async () => {
      tableService.delete.mockResolvedValue(mockTable);

      await controller.delete(1, 5);

      expect(tableService.delete).toHaveBeenCalledWith(1, 5);
    });

    it('should return the deleted table', async () => {
      tableService.delete.mockResolvedValue(mockTable);

      const result = await controller.delete(1, 5);

      expect(result).toEqual(mockTable);
    });
  });

  describe('updateStatus', () => {
    const updateTableStatusDto: UpdateTableStatusDto = { status: 'OCCUPIED' };
    const updatedTable: TableDto = { ...mockTable, status: 'OCCUPIED' };

    it('should call tableService.updateStatus with restaurantId, tableId, and status', async () => {
      tableService.updateStatus.mockResolvedValue(updatedTable);

      await controller.updateStatus(1, 5, updateTableStatusDto);

      expect(tableService.updateStatus).toHaveBeenCalledWith(1, 5, 'OCCUPIED');
    });

    it('should return the updated table', async () => {
      tableService.updateStatus.mockResolvedValue(updatedTable);

      const result = await controller.updateStatus(1, 5, updateTableStatusDto);

      expect(result).toEqual(updatedTable);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { TableService } from './table.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateTableDto } from './dto/create-table.dto';

// Represents a raw row returned by Supabase (matches Tables<'restaurant_table'>)
const mockTableRow = {
  id: 5,
  restaurant_id: 1,
  code: '1A',
  area: 'Main Floor',
  capacity: 4,
  status: 'FREE' as const,
};

// Expected DTO shape after toTableDto mapping (identical fields in this entity)
const expectedTableDto = {
  id: 5,
  restaurant_id: 1,
  code: '1A',
  area: 'Main Floor',
  capacity: 4,
  status: 'FREE',
};

const restaurantExistsResponse = { data: { id: 1 }, error: null };
const restaurantNotFoundResponse = { data: null, error: null };
const dbErrorResponse = { data: null, error: { message: 'Database error' } };

describe('TableService', () => {
  let service: TableService;
  let mockChain: {
    from: jest.Mock;
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    eq: jest.Mock;
    order: jest.Mock;
    single: jest.Mock;
    maybeSingle: jest.Mock;
  };

  beforeEach(async () => {
    // Each builder method returns `this` to allow chaining.
    // Terminal methods (maybeSingle, single, order) are left as bare jest.fn()
    // so each test configures their return values with mockResolvedValueOnce.
    mockChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TableService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockChain),
            getAdminClient: jest.fn().mockReturnValue(mockChain),
          },
        },
      ],
    }).compile();

    service = module.get<TableService>(TableService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  describe('findAllByRestaurant', () => {
    it('should return the tables for an existing restaurant', async () => {
      // 1st maybeSingle: assertRestaurantExists → restaurant found
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantExistsResponse);
      // order(): terminal call for the tables query
      mockChain.order.mockResolvedValueOnce({
        data: [mockTableRow],
        error: null,
      });

      const result = await service.findAllByRestaurant(1);

      expect(result).toEqual([expectedTableDto]);
    });

    it('should return an empty array when the restaurant exists but has no tables', async () => {
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantExistsResponse);
      mockChain.order.mockResolvedValueOnce({ data: [], error: null });

      const result = await service.findAllByRestaurant(1);

      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when the restaurant does not exist', async () => {
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantNotFoundResponse);

      await expect(service.findAllByRestaurant(1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on a database error when checking the restaurant', async () => {
      mockChain.maybeSingle.mockResolvedValueOnce(dbErrorResponse);

      await expect(service.findAllByRestaurant(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException on a database error when fetching tables', async () => {
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantExistsResponse);
      mockChain.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Failed to fetch tables' },
      });

      await expect(service.findAllByRestaurant(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  describe('create', () => {
    const createTableDto: CreateTableDto = {
      code: '1A',
      area: 'Main Floor',
      capacity: 4,
    };

    it('should create and return the new table', async () => {
      // 1st maybeSingle: assertRestaurantExists → restaurant found
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantExistsResponse);
      // single(): terminal call for the insert
      mockChain.single.mockResolvedValueOnce({
        data: mockTableRow,
        error: null,
      });

      const result = await service.create(1, createTableDto);

      expect(result).toEqual(expectedTableDto);
    });

    it('should set area to null when not provided in the dto', async () => {
      const dtoWithoutArea: CreateTableDto = { code: '2B', capacity: 2 };
      const rowWithoutArea = {
        ...mockTableRow,
        code: '2B',
        area: null,
        capacity: 2,
      };

      mockChain.maybeSingle.mockResolvedValueOnce(restaurantExistsResponse);
      mockChain.single.mockResolvedValueOnce({
        data: rowWithoutArea,
        error: null,
      });

      const result = await service.create(1, dtoWithoutArea);

      expect(result.area).toBeNull();
    });

    it('should throw NotFoundException when the restaurant does not exist', async () => {
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantNotFoundResponse);

      await expect(service.create(1, createTableDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on a database error during insert', async () => {
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantExistsResponse);
      mockChain.single.mockResolvedValueOnce(dbErrorResponse);

      await expect(service.create(1, createTableDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should delete and return the deleted table', async () => {
      // 1st maybeSingle: assertRestaurantExists → restaurant found
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantExistsResponse);
      // 2nd maybeSingle: find table → table found
      mockChain.maybeSingle.mockResolvedValueOnce({
        data: mockTableRow,
        error: null,
      });
      // The actual DELETE query terminates at .eq() which, when awaited as a
      // non-thenable mock chain, resolves to the chain object (error = undefined → no throw).

      const result = await service.delete(1, 5);

      expect(result).toEqual(expectedTableDto);
    });

    it('should throw NotFoundException when the restaurant does not exist', async () => {
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantNotFoundResponse);

      await expect(service.delete(1, 5)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when the table does not exist in the restaurant', async () => {
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantExistsResponse);
      mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      await expect(service.delete(1, 5)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on a database error when finding the table', async () => {
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantExistsResponse);
      mockChain.maybeSingle.mockResolvedValueOnce(dbErrorResponse);

      await expect(service.delete(1, 5)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  describe('updateStatus', () => {
    it('should update and return the table with the new status', async () => {
      const updatedRow = { ...mockTableRow, status: 'OCCUPIED' as const };

      // 1st maybeSingle: assertRestaurantExists → restaurant found
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantExistsResponse);
      // 2nd maybeSingle: update returns the updated row
      mockChain.maybeSingle.mockResolvedValueOnce({
        data: updatedRow,
        error: null,
      });

      const result = await service.updateStatus(1, 5, 'OCCUPIED');

      expect(result).toEqual({ ...expectedTableDto, status: 'OCCUPIED' });
    });

    it('should throw NotFoundException when the restaurant does not exist', async () => {
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantNotFoundResponse);

      await expect(service.updateStatus(1, 5, 'OCCUPIED')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when the table does not exist in the restaurant', async () => {
      // assertRestaurantExists passes, but update finds no matching row
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantExistsResponse);
      mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      await expect(service.updateStatus(1, 5, 'OCCUPIED')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on a database error during update', async () => {
      mockChain.maybeSingle.mockResolvedValueOnce(restaurantExistsResponse);
      mockChain.maybeSingle.mockResolvedValueOnce(dbErrorResponse);

      await expect(service.updateStatus(1, 5, 'OCCUPIED')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});

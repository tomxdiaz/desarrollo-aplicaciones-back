import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantService } from './restaurant.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('RestaurantService', () => {
  let service: RestaurantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn(),
            getAdminClient: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RestaurantService>(RestaurantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

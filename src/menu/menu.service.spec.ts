import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('MenuService', () => {
  let service: MenuService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn(),
            getAdminClient: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

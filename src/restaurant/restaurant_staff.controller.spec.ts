import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantStaffController } from './restaurant_staff.controller';
import { RestaurantStaffService } from './restaurant_staff.service';
import { AppUserService } from '../app_user/app_user.service';
import { RESTAURANT_ROLES_KEY } from '../auth/decorators/restaurant-roles.decorator';
import { RestaurantStaffRole } from '../utils/enums/restaurant-staff-role';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RestaurantRolesGuard } from '../auth/guards/restaurant-roles.guard';
import { SupabaseService } from '../supabase/supabase.service';

describe('RestaurantStaffController', () => {
  let controller: RestaurantStaffController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestaurantStaffController],
      providers: [
        {
          provide: RestaurantStaffService,
          useValue: {
            getStaff: jest.fn(),
            getMyRestaurantStaffInfo: jest.fn(),
            addStaff: jest.fn(),
            updateStaffRole: jest.fn(),
            removeStaff: jest.fn(),
          },
        },
        {
          provide: AppUserService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: SupabaseAuthGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        {
          provide: RestaurantRolesGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn(),
            getAnonClient: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RestaurantStaffController>(RestaurantStaffController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('allows cashier roles to request their own restaurant staff info', () => {
    const roles = Reflect.getMetadata(
      RESTAURANT_ROLES_KEY,
      controller.getMyRestaurantStaffInfo,
    );

    expect(roles).toEqual([
      RestaurantStaffRole.ADMIN,
      RestaurantStaffRole.CASHIER_PLUS,
      RestaurantStaffRole.CASHIER,
    ]);
  });
});
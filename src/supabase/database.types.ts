export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      app_user: {
        Row: {
          email: string;
          global_role: Database['public']['Enums']['global_role'];
          id: string;
        };
        Insert: {
          email: string;
          global_role?: Database['public']['Enums']['global_role'];
          id: string;
        };
        Update: {
          email?: string;
          global_role?: Database['public']['Enums']['global_role'];
          id?: string;
        };
        Relationships: [];
      };
      category: {
        Row: {
          id: number;
          menu_id: number;
          name: string;
        };
        Insert: {
          id?: never;
          menu_id: number;
          name: string;
        };
        Update: {
          id?: never;
          menu_id?: number;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'category_menu_id_fkey';
            columns: ['menu_id'];
            isOneToOne: false;
            referencedRelation: 'menu';
            referencedColumns: ['id'];
          },
        ];
      };
      menu: {
        Row: {
          id: number;
          name: string | null;
          restaurant_id: number;
        };
        Insert: {
          id?: never;
          name?: string | null;
          restaurant_id: number;
        };
        Update: {
          id?: never;
          name?: string | null;
          restaurant_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'menu_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: true;
            referencedRelation: 'restaurant';
            referencedColumns: ['id'];
          },
        ];
      };
      order_item: {
        Row: {
          id: number;
          order_id: number;
          product_id: number;
          quantity: number;
          subtotal: number;
        };
        Insert: {
          id?: never;
          order_id: number;
          product_id: number;
          quantity: number;
          subtotal: number;
        };
        Update: {
          id?: never;
          order_id?: number;
          product_id?: number;
          quantity?: number;
          subtotal?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'order_item_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'restaurant_order';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_item_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'product';
            referencedColumns: ['id'];
          },
        ];
      };
      product: {
        Row: {
          category_id: number;
          description: string | null;
          id: number;
          image: string | null;
          name: string;
          price: number;
        };
        Insert: {
          category_id: number;
          description?: string | null;
          id?: never;
          image?: string | null;
          name: string;
          price: number;
        };
        Update: {
          category_id?: number;
          description?: string | null;
          id?: never;
          image?: string | null;
          name?: string;
          price?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'product_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'category';
            referencedColumns: ['id'];
          },
        ];
      };
      restaurant: {
        Row: {
          address: string | null;
          description: string | null;
          id: number;
          name: string;
          owner_id: string;
        };
        Insert: {
          address?: string | null;
          description?: string | null;
          id?: never;
          name: string;
          owner_id: string;
        };
        Update: {
          address?: string | null;
          description?: string | null;
          id?: never;
          name?: string;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'restaurant_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'app_user';
            referencedColumns: ['id'];
          },
        ];
      };
      restaurant_order: {
        Row: {
          created_at: string;
          id: number;
          number: number;
          restaurant_id: number;
          status: Database['public']['Enums']['restaurant_order_status'];
          table_id: number;
          total: number;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: never;
          number: number;
          restaurant_id: number;
          status?: Database['public']['Enums']['restaurant_order_status'];
          table_id: number;
          total?: number;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: never;
          number?: number;
          restaurant_id?: number;
          status?: Database['public']['Enums']['restaurant_order_status'];
          table_id?: number;
          total?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'restaurant_order_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurant';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'restaurant_order_table_id_fkey';
            columns: ['table_id'];
            isOneToOne: false;
            referencedRelation: 'restaurant_table';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'restaurant_order_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'app_user';
            referencedColumns: ['id'];
          },
        ];
      };
      restaurant_staff: {
        Row: {
          id: number;
          restaurant_id: number;
          role: Database['public']['Enums']['restaurant_staff_role'];
          user_id: string;
        };
        Insert: {
          id?: never;
          restaurant_id: number;
          role: Database['public']['Enums']['restaurant_staff_role'];
          user_id: string;
        };
        Update: {
          id?: never;
          restaurant_id?: number;
          role?: Database['public']['Enums']['restaurant_staff_role'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'restaurant_staff_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurant';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'restaurant_staff_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'app_user';
            referencedColumns: ['id'];
          },
        ];
      };
      restaurant_table: {
        Row: {
          area: string | null;
          capacity: number;
          code: string;
          id: number;
          restaurant_id: number;
          status: Database['public']['Enums']['restaurant_table_status'];
        };
        Insert: {
          area?: string | null;
          capacity: number;
          code: string;
          id?: never;
          restaurant_id: number;
          status?: Database['public']['Enums']['restaurant_table_status'];
        };
        Update: {
          area?: string | null;
          capacity?: number;
          code?: string;
          id?: never;
          restaurant_id?: number;
          status?: Database['public']['Enums']['restaurant_table_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'restaurant_table_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurant';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      global_role: 'SUPER_USER' | 'OWNER' | 'USER';
      restaurant_order_status:
        | 'PENDING'
        | 'IN_PROCESS'
        | 'DELIVERED'
        | 'CANCELLED';
      restaurant_staff_role: 'ADMIN' | 'CASHIER_PLUS' | 'CASHIER';
      restaurant_table_status: 'FREE' | 'OCCUPIED';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      global_role: ['SUPER_USER', 'OWNER', 'USER'],
      restaurant_order_status: [
        'PENDING',
        'IN_PROCESS',
        'DELIVERED',
        'CANCELLED',
      ],
      restaurant_staff_role: ['ADMIN', 'CASHIER_PLUS', 'CASHIER'],
      restaurant_table_status: ['FREE', 'OCCUPIED'],
    },
  },
} as const;

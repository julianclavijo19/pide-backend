import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1709000000000 implements MigrationInterface {
  name = 'InitialMigration1709000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('CLIENT', 'RESTAURANT', 'DRIVER', 'ADMIN');
      CREATE TYPE "order_status_enum" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED');
      CREATE TYPE "payment_method_enum" AS ENUM ('CASH', 'CARD', 'PSE', 'NEQUI');
      CREATE TYPE "coupon_type_enum" AS ENUM ('PERCENT', 'FIXED');
      CREATE TYPE "review_target_type_enum" AS ENUM ('RESTAURANT', 'DRIVER');
      CREATE TYPE "vehicle_type_enum" AS ENUM ('MOTORCYCLE', 'BICYCLE', 'CAR');
    `);

    // Users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(100) NOT NULL,
        "email" character varying(255) NOT NULL,
        "phone" character varying(20),
        "password_hash" character varying NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'CLIENT',
        "is_active" boolean NOT NULL DEFAULT true,
        "fcm_token" character varying,
        "refresh_token" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Addresses
    await queryRunner.query(`
      CREATE TABLE "addresses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "label" character varying(50) NOT NULL,
        "lat" numeric(10,7) NOT NULL,
        "lng" numeric(10,7) NOT NULL,
        "street" character varying(255) NOT NULL,
        "details" character varying(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_addresses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_addresses_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Restaurants
    await queryRunner.query(`
      CREATE TABLE "restaurants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(150) NOT NULL,
        "description" text,
        "logo_url" character varying,
        "cover_url" character varying,
        "owner_id" uuid NOT NULL,
        "category_tags" text,
        "schedule" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_open" boolean NOT NULL DEFAULT false,
        "avg_rating" numeric(3,2) NOT NULL DEFAULT 0,
        "total_orders" integer NOT NULL DEFAULT 0,
        "commission_rate" numeric(5,2) NOT NULL DEFAULT 15.00,
        "address" character varying(255),
        "lat" numeric(10,7),
        "lng" numeric(10,7),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_restaurants" PRIMARY KEY ("id"),
        CONSTRAINT "FK_restaurants_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Menu Categories
    await queryRunner.query(`
      CREATE TABLE "menu_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "restaurant_id" uuid NOT NULL,
        "name" character varying(100) NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_menu_categories" PRIMARY KEY ("id"),
        CONSTRAINT "FK_menu_categories_restaurant" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE
      )
    `);

    // Menu Items
    await queryRunner.query(`
      CREATE TABLE "menu_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "category_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "description" text,
        "price" numeric(10,2) NOT NULL,
        "image_url" character varying,
        "is_available" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_menu_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_menu_items_category" FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE CASCADE
      )
    `);

    // Orders
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "client_id" uuid NOT NULL,
        "restaurant_id" uuid NOT NULL,
        "driver_id" uuid,
        "subtotal" numeric(10,2) NOT NULL DEFAULT 0,
        "delivery_fee" numeric(10,2) NOT NULL DEFAULT 0,
        "discount" numeric(10,2) NOT NULL DEFAULT 0,
        "total" numeric(10,2) NOT NULL DEFAULT 0,
        "status" "order_status_enum" NOT NULL DEFAULT 'PENDING',
        "payment_method" "payment_method_enum" NOT NULL DEFAULT 'CASH',
        "address" jsonb,
        "timeline" jsonb NOT NULL DEFAULT '[]',
        "coupon_code" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_client" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_orders_restaurant" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_orders_driver" FOREIGN KEY ("driver_id") REFERENCES "users"("id")
      )
    `);

    // Order Items
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "order_id" uuid NOT NULL,
        "menu_item_id" uuid NOT NULL,
        "name" character varying(150) NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "notes" text,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
      )
    `);

    // Drivers
    await queryRunner.query(`
      CREATE TABLE "drivers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "vehicle_type" "vehicle_type_enum" NOT NULL DEFAULT 'MOTORCYCLE',
        "license_url" character varying,
        "is_online" boolean NOT NULL DEFAULT false,
        "current_lat" numeric(10,7),
        "current_lng" numeric(10,7),
        "is_verified" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_drivers_user_id" UNIQUE ("user_id"),
        CONSTRAINT "PK_drivers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_drivers_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Coupons
    await queryRunner.query(`
      CREATE TABLE "coupons" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" character varying(50) NOT NULL,
        "type" "coupon_type_enum" NOT NULL,
        "value" numeric(10,2) NOT NULL,
        "min_order" numeric(10,2) NOT NULL DEFAULT 0,
        "max_uses" integer NOT NULL DEFAULT 0,
        "used_count" integer NOT NULL DEFAULT 0,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_coupons_code" UNIQUE ("code"),
        CONSTRAINT "PK_coupons" PRIMARY KEY ("id")
      )
    `);

    // Reviews
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "order_id" uuid NOT NULL,
        "client_id" uuid NOT NULL,
        "target_id" uuid NOT NULL,
        "target_type" "review_target_type_enum" NOT NULL,
        "rating" integer NOT NULL,
        "comment" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reviews_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_client" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Notifications
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "body" text NOT NULL,
        "data" jsonb,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Chat Messages
    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "order_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "content" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_chat_messages_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_chat_messages_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_client" ON "orders" ("client_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_restaurant" ON "orders" ("restaurant_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_driver" ON "orders" ("driver_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_reviews_target" ON "reviews" ("target_id", "target_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_user" ON "notifications" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_chat_messages_order" ON "chat_messages" ("order_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coupons" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "drivers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "restaurants" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "addresses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "vehicle_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "review_target_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "coupon_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_method_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}

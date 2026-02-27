import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { dataSourceOptions } from '../config/typeorm.config';
import { User } from '../users/entities/user.entity';
import { Address } from '../users/entities/address.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { MenuCategory } from '../menus/entities/menu-category.entity';
import { MenuItem } from '../menus/entities/menu-item.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { Role } from '../common/enums/role.enum';
import { VehicleType } from '../common/enums/vehicle-type.enum';
import { CouponType } from '../common/enums/coupon-type.enum';

async function seed() {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();
  console.log('Database connected for seeding...');

  const userRepo = dataSource.getRepository(User);
  const addressRepo = dataSource.getRepository(Address);
  const restaurantRepo = dataSource.getRepository(Restaurant);
  const categoryRepo = dataSource.getRepository(MenuCategory);
  const itemRepo = dataSource.getRepository(MenuItem);
  const driverRepo = dataSource.getRepository(Driver);
  const couponRepo = dataSource.getRepository(Coupon);

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // ===== ADMIN USER =====
  const admin = await userRepo.save(
    userRepo.create({
      name: 'Admin Pide',
      email: 'admin@pide.co',
      phone: '+573001000000',
      passwordHash,
      role: Role.ADMIN,
    }),
  );
  console.log(`✔ Admin created: ${admin.email}`);

  // ===== CLIENT USERS =====
  const clients: User[] = [];
  const clientData = [
    { name: 'María García', email: 'maria@example.com', phone: '+573002000001' },
    { name: 'Carlos López', email: 'carlos@example.com', phone: '+573002000002' },
    { name: 'Ana Rodríguez', email: 'ana@example.com', phone: '+573002000003' },
  ];
  for (const data of clientData) {
    const client = await userRepo.save(
      userRepo.create({ ...data, passwordHash, role: Role.CLIENT }),
    );
    clients.push(client);

    // Add address for each client
    await addressRepo.save(
      addressRepo.create({
        userId: client.id,
        label: 'Casa',
        lat: 4.6097 + Math.random() * 0.05,
        lng: -74.0817 + Math.random() * 0.05,
        street: `Calle ${Math.floor(Math.random() * 200)} #${Math.floor(Math.random() * 100)}-${Math.floor(Math.random() * 100)}`,
        details: `Apto ${Math.floor(Math.random() * 500) + 100}`,
      }),
    );
  }
  console.log(`✔ ${clients.length} clients created`);

  // ===== RESTAURANT OWNERS & RESTAURANTS =====
  const restaurantOwner1 = await userRepo.save(
    userRepo.create({
      name: 'Pedro Martínez',
      email: 'pedro@burgerpalace.com',
      phone: '+573003000001',
      passwordHash,
      role: Role.RESTAURANT,
    }),
  );

  const restaurantOwner2 = await userRepo.save(
    userRepo.create({
      name: 'Lucía Hernández',
      email: 'lucia@sushihouse.com',
      phone: '+573003000002',
      passwordHash,
      role: Role.RESTAURANT,
    }),
  );

  const schedule = {
    mon: { open: '10:00', close: '22:00' },
    tue: { open: '10:00', close: '22:00' },
    wed: { open: '10:00', close: '22:00' },
    thu: { open: '10:00', close: '22:00' },
    fri: { open: '10:00', close: '23:00' },
    sat: { open: '11:00', close: '23:00' },
    sun: { open: '11:00', close: '21:00' },
  };

  const restaurant1 = await restaurantRepo.save(
    restaurantRepo.create({
      name: 'Burger Palace',
      description: 'Las mejores hamburguesas artesanales de la ciudad',
      ownerId: restaurantOwner1.id,
      categoryTags: ['Hamburguesas', 'Comida rápida', 'Americana'],
      schedule,
      isActive: true,
      isOpen: true,
      address: 'Calle 85 #15-20, Bogotá',
      lat: 4.6737,
      lng: -74.0566,
      commissionRate: 15.0,
    }),
  );

  const restaurant2 = await restaurantRepo.save(
    restaurantRepo.create({
      name: 'Sushi House',
      description: 'Auténtico sushi japonés con ingredientes frescos',
      ownerId: restaurantOwner2.id,
      categoryTags: ['Sushi', 'Japonesa', 'Asiática'],
      schedule,
      isActive: true,
      isOpen: true,
      address: 'Carrera 11 #93-52, Bogotá',
      lat: 4.6801,
      lng: -74.0479,
      commissionRate: 12.0,
    }),
  );

  console.log('✔ 2 restaurants created');

  // ===== MENU: BURGER PALACE =====
  const burgerCat = await categoryRepo.save(
    categoryRepo.create({ restaurantId: restaurant1.id, name: 'Hamburguesas', position: 0 }),
  );
  const sidesCat = await categoryRepo.save(
    categoryRepo.create({ restaurantId: restaurant1.id, name: 'Acompañamientos', position: 1 }),
  );

  const burgerItems = [
    { categoryId: burgerCat.id, name: 'Burger Clásica', description: 'Carne 150g, lechuga, tomate, queso americano', price: 18900 },
    { categoryId: burgerCat.id, name: 'Burger BBQ', description: 'Carne 150g, bacon, cebolla caramelizada, salsa BBQ', price: 22900 },
    { categoryId: burgerCat.id, name: 'Burger Doble', description: 'Doble carne 300g, doble queso, jalapeños', price: 27900 },
    { categoryId: sidesCat.id, name: 'Papas Fritas', description: 'Porción generosa de papas crujientes', price: 8900 },
    { categoryId: sidesCat.id, name: 'Aros de Cebolla', description: 'Aros de cebolla apanados', price: 9900 },
  ];

  for (const item of burgerItems) {
    await itemRepo.save(itemRepo.create(item));
  }

  // ===== MENU: SUSHI HOUSE =====
  const rollsCat = await categoryRepo.save(
    categoryRepo.create({ restaurantId: restaurant2.id, name: 'Rolls', position: 0 }),
  );
  const specialCat = await categoryRepo.save(
    categoryRepo.create({ restaurantId: restaurant2.id, name: 'Especiales', position: 1 }),
  );

  const sushiItems = [
    { categoryId: rollsCat.id, name: 'California Roll', description: 'Cangrejo, aguacate, pepino (8 piezas)', price: 24900 },
    { categoryId: rollsCat.id, name: 'Tempura Roll', description: 'Langostino tempura, queso crema (8 piezas)', price: 28900 },
    { categoryId: rollsCat.id, name: 'Spicy Tuna Roll', description: 'Atún picante, pepino, ajonjolí (8 piezas)', price: 26900 },
    { categoryId: specialCat.id, name: 'Sashimi Mix', description: 'Salmón, atún, pulpo (12 piezas)', price: 38900 },
    { categoryId: specialCat.id, name: 'Ramen de Cerdo', description: 'Caldo tonkotsu, chashu, huevo, nori', price: 32900 },
  ];

  for (const item of sushiItems) {
    await itemRepo.save(itemRepo.create(item));
  }

  console.log('✔ 10 menu items created (5 per restaurant)');

  // ===== DRIVER USERS =====
  const driverData = [
    { name: 'Juan Díaz', email: 'juan.driver@example.com', phone: '+573004000001' },
    { name: 'Andrés Torres', email: 'andres.driver@example.com', phone: '+573004000002' },
  ];

  for (const data of driverData) {
    const driverUser = await userRepo.save(
      userRepo.create({ ...data, passwordHash, role: Role.DRIVER }),
    );
    await driverRepo.save(
      driverRepo.create({
        userId: driverUser.id,
        vehicleType: VehicleType.MOTORCYCLE,
        isOnline: true,
        isVerified: true,
        currentLat: 4.6097 + Math.random() * 0.05,
        currentLng: -74.0817 + Math.random() * 0.05,
      }),
    );
  }
  console.log('✔ 2 drivers created');

  // ===== COUPONS =====
  await couponRepo.save(
    couponRepo.create({
      code: 'WELCOME10',
      type: CouponType.PERCENT,
      value: 10,
      minOrder: 20000,
      maxUses: 1000,
      expiresAt: new Date('2027-12-31'),
    }),
  );

  await couponRepo.save(
    couponRepo.create({
      code: 'PIDE5000',
      type: CouponType.FIXED,
      value: 5000,
      minOrder: 30000,
      maxUses: 500,
      expiresAt: new Date('2027-06-30'),
    }),
  );
  console.log('✔ 2 coupons created');

  console.log('\n🎉 Seeding complete!\n');
  console.log('Login credentials for all seeded users:');
  console.log('  Password: Password123!');
  console.log('  Admin:    admin@pide.co');
  console.log('  Clients:  maria@example.com, carlos@example.com, ana@example.com');
  console.log('  Restaurants: pedro@burgerpalace.com, lucia@sushihouse.com');
  console.log('  Drivers:  juan.driver@example.com, andres.driver@example.com');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

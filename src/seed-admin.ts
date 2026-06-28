import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../src/users/entities/user.entity';
import { Specialist } from '../src/specialists/entities/specialist.entity';
import { Category, Subcategory } from '../src/categories/entities/category.entity';
import { Schedule } from '../src/schedules/entities/schedule.entity';
import { OfferedService } from '../src/offered-services/entities/offered-service.entity';

const seedAdmin = async () => {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_NAME || 'creatucita',
    entities: [User, Specialist, Category, Subcategory, Schedule, OfferedService],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Connected to database');

  const userRepository = dataSource.getRepository(User);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@creatucita.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const adminName = process.env.ADMIN_NAME || 'Administrador';

  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
    withDeleted: true,
  });

  if (existingAdmin) {
    console.log('Admin user already exists:', adminEmail);
    await dataSource.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = userRepository.create({
    email: adminEmail,
    password: hashedPassword,
    name: adminName,
    role: UserRole.ADMIN,
    isActive: true,
  });

  await userRepository.save(admin);
  console.log('Admin user created successfully!');
  console.log('Email:', adminEmail);
  console.log('Password:', adminPassword);

  await dataSource.destroy();
};

seedAdmin().catch((error) => {
  console.error('Error seeding admin:', error);
  process.exit(1);
});

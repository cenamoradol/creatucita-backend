import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './users/entities/user.entity';
import {
  Specialist,
  SpecialistStatus,
} from './specialists/entities/specialist.entity';
import { Category, Subcategory } from './categories/entities/category.entity';
import { Schedule } from './schedules/entities/schedule.entity';
import { OfferedService } from './offered-services/entities/offered-service.entity';
import {
  Appointment,
  AppointmentStatus,
} from './appointments/entities/appointment.entity';
import { Note } from './specialists/entities/note.entity';
import { Reminder } from './specialists/entities/reminder.entity';

const TOTAL = 20;
const PASSWORD = 'Test1234!';
const EMAIL_DOMAIN = 'test.creatucita.com';
const CITIES = [
  'San Pedro Sula',
  'Tegucigalpa',
  'La Ceiba',
  'Choluteca',
  'Comayagua',
  'Puerto Cortés',
  'Copán',
  'Ocotepeque',
];

// Una fila por especialidad: de aquí salen categorías, subcategorías y servicios.
const SPECIALTIES = [
  {
    category: 'Odontología',
    subcategory: 'Odontología General',
    service: 'Consulta y limpieza dental',
    price: 500,
    duration: 30,
  },
  {
    category: 'Medicina General',
    subcategory: 'Consulta de Medicina General',
    service: 'Consulta médica general',
    price: 400,
    duration: 30,
  },
  {
    category: 'Pediatría',
    subcategory: 'Pediatría Infantil',
    service: 'Control de niño sano',
    price: 450,
    duration: 45,
  },
  {
    category: 'Ginecología',
    subcategory: 'Ginecología y Obstetricia',
    service: 'Control prenatal',
    price: 600,
    duration: 45,
  },
  {
    category: 'Cardiología',
    subcategory: 'Cardiología Preventiva',
    service: 'Evaluación cardiaca',
    price: 700,
    duration: 60,
  },
  {
    category: 'Dermatología',
    subcategory: 'Dermatología Clínica',
    service: 'Consulta de piel',
    price: 550,
    duration: 30,
  },
  {
    category: 'Oftalmología',
    subcategory: 'Oftalmología Preventiva',
    service: 'Examen de la vista',
    price: 500,
    duration: 30,
  },
  {
    category: 'Psiquiatría',
    subcategory: 'Salud Mental',
    service: 'Terapia psiquiátrica',
    price: 800,
    duration: 60,
  },
  {
    category: 'Neurología',
    subcategory: 'Neurología Clínica',
    service: 'Evaluación neurológica',
    price: 750,
    duration: 60,
  },
  {
    category: 'Ortopedia',
    subcategory: 'Ortopedia y Traumatología',
    service: 'Consulta de ortopedia',
    price: 600,
    duration: 45,
  },
  {
    category: 'Fisioterapia',
    subcategory: 'Fisioterapia Rehabilitadora',
    service: 'Sesión de fisioterapia',
    price: 350,
    duration: 45,
  },
  {
    category: 'Nutrición',
    subcategory: 'Nutrición Clínica',
    service: 'Consulta de nutrición',
    price: 450,
    duration: 30,
  },
  {
    category: 'Traumatología',
    subcategory: 'Traumatología Deportiva',
    service: 'Valoración de lesiones',
    price: 550,
    duration: 45,
  },
  {
    category: 'Psicología',
    subcategory: 'Psicología Clínica',
    service: 'Sesión de terapia psicológica',
    price: 650,
    duration: 60,
  },
  {
    category: 'Urología',
    subcategory: 'Urología',
    service: 'Consulta urológica',
    price: 600,
    duration: 30,
  },
  {
    category: 'Endocrinología',
    subcategory: 'Endocrinología y Diabetes',
    service: 'Control de diabetes',
    price: 700,
    duration: 45,
  },
  {
    category: 'Neumología',
    subcategory: 'Neumología y Neumonía',
    service: 'Evaluación respiratoria',
    price: 500,
    duration: 45,
  },
  {
    category: 'Reumatología',
    subcategory: 'Reumatología',
    service: 'Consulta reumatológica',
    price: 650,
    duration: 45,
  },
  {
    category: 'Otorrinolaringología',
    subcategory: 'Otorrinolaringología',
    service: 'Evaluación auditiva',
    price: 500,
    duration: 30,
  },
  {
    category: 'Medicina Deportiva',
    subcategory: 'Medicina Deportiva',
    service: 'Valoración deportiva',
    price: 450,
    duration: 45,
  },
];

const SPECIALIST_NAMES = [
  'Dra. María Fernanda López',
  'Dr. Carlos Alberto Ramírez',
  'Dra. Ana Lucía Martínez',
  'Dr. Roberto José Silva',
  'Dra. Laura Sofía Torres',
  'Dr. Diego Alejandro Pérez',
  'Dra. Sofia Isabel Morales',
  'Dr. Miguel Ángel Cruz',
  'Dra. Isabella Cristina Castro',
  'Dr. Sebastián Alejandro Flores',
  'Dra. Daniela Nicole Mejía',
  'Dr. Andrés Eduardo Nájera',
  'Dra. Gabriela María Zelaya',
  'Dr. Fernando José Bonilla',
  'Dra. Ximara Yolanda Duarte',
  'Dr. Héctor Manuel Oliva',
  'Dra. Génesis Abigail Paz',
  'Dr. Luis Alberto Fúnez',
  'Dra. Pamela Andrea Godoy',
  'Dr. Emmanuel Josué Colindres',
];

// Para los especialistas de las subcategorías de la primera categoría.
const SPECIALIST_NAMES_SUBCATEGORY = [
  'Dra. Lourdes Fajardo',
  'Dr. Wilmer Cárcamo',
  'Dra. Yorlenis Munguía',
  'Dr. Erick Sagastume',
  'Dra. Sandra Portillo',
  'Dra. Valeria Quintanilla',
  'Dr. Josué Zelaya',
  'Dra. Melissa Banegas',
  'Dr. Aldo Elizondo',
  'Dra. Carolina Carrasco',
  'Dr. Nelson Miranda',
  'Dr. Elmer Cruz',
  'Dra. Yamileth Discua',
  'Dr. Walter Midence',
  'Dra. Kathia Yarosh',
  'Dr. Iván Fiallos',
  'Dra. Fabiola Andino',
  'Dr. Danilo Pineda',
  'Dra. Perla Reyes',
  'Dr. Hugo Espinoza',
];

// Subcategorías que se agregan a la primera categoría (la que muestra el inicio de
// la app) para que el carrusel de categorías tenga más opciones.
const FIRST_CATEGORY_SUBCATEGORIES = [
  'Endodoncia',
  'Ortodoncia',
  'Periodoncia',
  'Prostodoncia',
  'Odontopediatría',
  'Cirugía Oral',
  'Higiene Dental',
];

const MIN_PER_SUBCATEGORY = 3;

// 3 especialistas por subcategoría adicional, en el mismo orden de la lista anterior.
const NEW_SPECIALIST_NAMES = [
  'Dra. Norma Zelaya',
  'Dr. Iván Discua',
  'Dra. Silvia Munguía',
  'Dr. Eugenio Portillo',
  'Dra. Rosa Elena Cruz',
  'Dr. Mauricio Andino',
  'Dra. Julia Pineda',
  'Dr. Gonzalo Fiallos',
  'Dra. Verania Midence',
  'Dr. Ulises Yarosh',
  'Dra. Mayra Elizabeth Reyes',
  'Dr. Salomón Espinoza',
  'Dra. Xiomara Núñez',
  'Dr. Gerardo Rosales',
  'Dra. Keyla Fajardo',
  'Dr. Leonel Zavala',
  'Dra. Mariela Urbina',
  'Dr. Otto Wolters',
  'Dra. Rosalina Alvarado',
  'Dr. Baldemar Suazo',
  'Dra. Yency Paz',
];

const CLIENT_NAMES = [
  'Andrea Nicole Mathew',
  'José Luis Pineda',
  'Daniela Sofía Renderos',
  'Marco Antonio Discua',
  'Karla Yamileth Munguía',
  'Óscar Eduardo Villeda',
  'Melissa Abigail Zavala',
  'Brandon Josué Velásquez',
  'Fabiola Andrea Ulloa',
  'Mauricio Alejandro Canales',
  'Génesis Yarith Vargas',
  'Kevin Josué Munguía',
  'Silvia Elena Alvarado',
  'Ricardo Antonio Paz',
  'Alejandra Sofía Turcios',
  'Fernando José Cruz',
  'Natalia Abigail Discua',
  'Edwin Alberto Zelaya',
  'Karen Yisel Martínez',
  'Óscar Manuel Figueroa',
];

// Un solo bloque horario por especialista: 20 horarios que cubren los 7 días.
const SCHEDULE_WINDOWS = [
  ['09:00:00', '18:00:00'],
  ['08:00:00', '13:00:00'],
  ['13:00:00', '19:00:00'],
  ['10:00:00', '16:00:00'],
];

const NOTE_CATEGORIES = [
  'General',
  'Tratamiento',
  'Seguimiento',
  'Receta',
  'Alergia',
];
const REMINDER_TITLES = [
  'Llamar al paciente',
  'Confirmar cita',
  'Revisar historial',
  'Enviar receta',
  'Renovar laboratorio',
];
const APPOINTMENT_NOTES = [
  'Consulta de control del tratamiento.',
  'Reporta dolor desde hace tres días.',
  'Primera consulta, se indica estudio de laboratorio.',
  'Seguimiento de resultados de laboratorio.',
  'Solicita ajuste de horarios.',
];

const pad = (n: number) => String(n).padStart(2, '0');
const phone = (i: number) => `9${String(4000000 + i * 137).padStart(7, '0')}`;
const rtn = (i: number) => `0501${1980 + (i % 20)}${pad(i + 1)}0000`;
const dni = (i: number) => `0801${1985 + (i % 15)}${pad(i + 1)}00`;

// Fecha local (YYYY-MM-DD) del día de la semana pedido, desplazada N semanas.
const weekdayDate = (dayOfWeek: number, weekOffset: number): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + ((dayOfWeek - d.getDay() + 7) % 7) + weekOffset * 7);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}:00`;
};

const seed = async () => {
  const url = process.env.DATABASE_URL;
  const dataSource = new DataSource({
    type: 'postgres',
    ...(url
      ? { url, ssl: { rejectUnauthorized: false } }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5433', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'password123',
          database: process.env.DB_NAME || 'creatucita',
        }),
    entities: [
      User,
      Specialist,
      Category,
      Subcategory,
      Schedule,
      OfferedService,
      Appointment,
      Note,
      Reminder,
    ],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Conectado a la base de datos');

  const users = dataSource.getRepository(User);
  const specialists = dataSource.getRepository(Specialist);
  const categories = dataSource.getRepository(Category);
  const subcategories = dataSource.getRepository(Subcategory);
  const schedules = dataSource.getRepository(Schedule);
  const offeredServices = dataSource.getRepository(OfferedService);
  const appointments = dataSource.getRepository(Appointment);
  const notes = dataSource.getRepository(Note);
  const reminders = dataSource.getRepository(Reminder);

  // Un solo hash compartido: la contraseña de prueba es la misma para todos.
  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  const created: Record<string, number> = {};
  const count = (key: string) => {
    created[key] = (created[key] || 0) + 1;
  };

  // 1. Categorías y subcategorías
  const subcategoryIds: string[] = [];
  for (const spec of SPECIALTIES) {
    let category = await categories.findOne({ where: { name: spec.category } });
    if (!category) {
      category = await categories.save(
        categories.create({
          name: spec.category,
          description: `Servicios profesionales de ${spec.category.toLowerCase()}.`,
        }),
      );
      count('categories');
    }

    let subcategory = await subcategories.findOne({
      where: { name: spec.subcategory },
    });
    if (!subcategory) {
      subcategory = await subcategories.save(
        subcategories.create({ name: spec.subcategory, category }),
      );
      count('subcategories');
    }
    subcategoryIds.push(subcategory.id);
  }

  // 2. Usuarios clientes
  const clientIds: string[] = [];
  for (let i = 0; i < TOTAL; i++) {
    const email = `seed.cliente${pad(i + 1)}@${EMAIL_DOMAIN}`;
    let user = await users.findOne({ where: { email } });
    if (!user) {
      user = await users.save(
        users.create({
          email,
          password: hashedPassword,
          name: CLIENT_NAMES[i],
          role: UserRole.CLIENT,
          telephone: phone(i),
          locationCountry: 'Honduras',
          locationCity: CITIES[i % CITIES.length],
          isActive: i !== 19, // el último queda inactivo para probar el bloqueo de login
        }),
      );
      count('users (clientes)');
    }
    clientIds.push(user.id);
  }

  // 3. Usuarios especialistas + perfil de especialista
  const specialistIds: string[] = [];
  for (let i = 0; i < TOTAL; i++) {
    const email = `seed.especialista${pad(i + 1)}@${EMAIL_DOMAIN}`;
    let user = await users.findOne({ where: { email } });
    if (!user) {
      user = await users.save(
        users.create({
          email,
          password: hashedPassword,
          name: SPECIALIST_NAMES[i],
          role: UserRole.SPECIALIST,
          telephone: phone(i + 100),
          locationCountry: 'Honduras',
          locationCity: CITIES[i % CITIES.length],
          profilePicture: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(SPECIALIST_NAMES[i])}`,
          isActive: true,
        }),
      );
      count('users (especialistas)');
    }

    let specialist = await specialists.findOne({
      where: { user: { id: user.id } },
    });
    if (!specialist) {
      const spec = SPECIALTIES[i];
      specialist = await specialists.save(
        specialists.create({
          user,
          bio: `Profesional en ${spec.category.toLowerCase()} con ${5 + (i % 15)} años de experiencia. Atiende en consultorio privado y hospital.`,
          phone: phone(i + 100),
          rtn: rtn(i),
          dni: dni(i),
          clinicAddress: `Barrio ${CITIES[i % CITIES.length]}, calle principal, consultorio ${i + 1}`,
          appointmentDuration: [30, 45, 60][i % 3],
          minAdvanceBooking: [1, 2, 4, 24][i % 4],
          status:
            i === 18
              ? SpecialistStatus.PENDING
              : i === 19
                ? SpecialistStatus.REJECTED
                : SpecialistStatus.APPROVED,
          profilePicture: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(SPECIALIST_NAMES[i])}`,
          subcategories: [
            { id: subcategoryIds[i] },
            { id: subcategoryIds[(i + 10) % TOTAL] },
          ],
        }),
      );
      count('specialists');
    }
    specialistIds.push(specialist.id);
  }

  // 4. Servicios ofrecidos
  for (let i = 0; i < TOTAL; i++) {
    const spec = SPECIALTIES[i];
    const exists = await offeredServices.findOne({
      where: { specialist: { id: specialistIds[i] }, specialty: spec.category },
    });
    if (!exists) {
      await offeredServices.save(
        offeredServices.create({
          specialist: { id: specialistIds[i] },
          specialty: spec.category,
          specialties: spec.service,
          price: spec.price,
          duration: spec.duration,
        }),
      );
      count('offered_services');
    }
  }

  // 5. Horarios
  const scheduleDays: number[] = [];
  for (let i = 0; i < TOTAL; i++) {
    const dayOfWeek = i % 7;
    const [startTime, endTime] = SCHEDULE_WINDOWS[i % SCHEDULE_WINDOWS.length];
    scheduleDays.push(dayOfWeek);
    const exists = await schedules.findOne({
      where: { specialist: { id: specialistIds[i] }, dayOfWeek },
    });
    if (!exists) {
      await schedules.save(
        schedules.create({
          specialist: { id: specialistIds[i] },
          dayOfWeek,
          startTime,
          endTime,
          isActive: true,
        }),
      );
      count('schedules');
    }
  }

  // 6. Notas
  for (let i = 0; i < TOTAL; i++) {
    const title = `Nota de seguimiento ${pad(i + 1)}`;
    const exists = await notes.findOne({
      where: { specialist: { id: specialistIds[i] }, title },
    });
    if (!exists) {
      await notes.save(
        notes.create({
          title,
          content: `Paciente attends consulta de ${SPECIALTIES[i].category.toLowerCase()}. Se indica continuar con el tratamiento y control en la próxima visita.`,
          category: NOTE_CATEGORIES[i % NOTE_CATEGORIES.length],
          archived: i === 19,
          specialist: { id: specialistIds[i] },
        }),
      );
      count('notes');
    }
  }

  // 7. Recordatorios
  for (let i = 0; i < TOTAL; i++) {
    const title = `${REMINDER_TITLES[i % REMINDER_TITLES.length]} ${pad(i + 1)}`;
    const exists = await reminders.findOne({
      where: { specialist: { id: specialistIds[i] }, title },
    });
    if (!exists) {
      await reminders.save(
        reminders.create({
          title,
          description: `Pendiente relacionado con ${SPECIALTIES[i].category.toLowerCase()}.`,
          date: weekdayDate(scheduleDays[i], 1 + (i % 3)),
          time: '09:00:00',
          priority: ['baja', 'media', 'alta'][i % 3],
          completed: i === 19,
          specialist: { id: specialistIds[i] },
        }),
      );
      count('reminders');
    }
  }

  // 8. Citas
  for (let i = 0; i < TOTAL; i++) {
    const spec = SPECIALTIES[i];
    const [windowStart] = SCHEDULE_WINDOWS[i % SCHEDULE_WINDOWS.length];
    const duration = [30, 45, 60][i % 3];
    const startTime = addMinutes(windowStart, 60);
    const status = [
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
    ][i % 4];
    const weekOffset =
      status === AppointmentStatus.COMPLETED
        ? -(1 + (i % 3))
        : status === AppointmentStatus.CANCELLED
          ? -(1 + (i % 2))
          : 1 + (i % 4);
    const date = weekdayDate(scheduleDays[i], weekOffset);

    const exists = await appointments.findOne({
      where: { specialist: { id: specialistIds[i] }, date, startTime },
    });
    if (exists) continue;

    // Tres citas sin usuario registrado (agendadas por el especialista).
    const manual = i % 7 === 3;
    await appointments.save(
      appointments.create({
        client: manual ? undefined : { id: clientIds[i] },
        clientName: manual ? CLIENT_NAMES[i] : undefined,
        clientEmail: manual
          ? `seed.cliente${pad(i + 1)}@${EMAIL_DOMAIN}`
          : undefined,
        clientPhone: manual ? phone(i) : undefined,
        specialist: { id: specialistIds[i] },
        date,
        startTime,
        endTime: addMinutes(startTime, duration),
        status,
        notes: APPOINTMENT_NOTES[i % APPOINTMENT_NOTES.length],
        service: spec.service,
        price: spec.price,
      }),
    );
    count('appointments');
  }

  // 9. Subcategorías y especialistas de la primera categoría.
  // La app móvil muestra cats[0].subcategories: le garantizamos varias subcategorías
  // y especialistas en cada una para que el carrusel nunca devuelva una pantalla vacía.
  const firstCategory = (
    await categories.find({ relations: ['subcategories'] })
  )[0];

  if (firstCategory) {
    const slug = (name: string) =>
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    for (const name of FIRST_CATEGORY_SUBCATEGORIES) {
      const exists = await subcategories.findOne({
        where: { name, category: { id: firstCategory.id } },
      });
      if (!exists) {
        await subcategories.save(
          subcategories.create({ name, category: { id: firstCategory.id } }),
        );
        count('subcategories (primera categoría)');
      }
    }

    const subs = await subcategories.find({
      where: { category: { id: firstCategory.id } },
    });

    for (const [si, sub] of subs.entries()) {
      const extra = FIRST_CATEGORY_SUBCATEGORIES.indexOf(sub.name);
      for (let n = 1; n <= MIN_PER_SUBCATEGORY; n++) {
        const email = `seed.${slug(sub.name)}.${pad(n)}@${EMAIL_DOMAIN}`;
        const name =
          extra >= 0
            ? NEW_SPECIALIST_NAMES[extra * MIN_PER_SUBCATEGORY + (n - 1)]
            : SPECIALIST_NAMES_SUBCATEGORY[n - 1];
        const base = 60 + si * MIN_PER_SUBCATEGORY + (n - 1);
        const serviceName = `Consulta de ${sub.name.toLowerCase()}`;
        const price = 400 + (base % 6) * 50;
        const duration = [30, 45, 60][base % 3];

        let user = await users.findOne({ where: { email } });
        if (!user) {
          user = await users.save(
            users.create({
              email,
              password: hashedPassword,
              name,
              role: UserRole.SPECIALIST,
              telephone: phone(base),
              locationCountry: 'Honduras',
              locationCity: CITIES[base % CITIES.length],
              profilePicture: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
              isActive: true,
            }),
          );
          count('users (especialistas por subcategoría)');
        }

        let specialist = await specialists.findOne({
          where: { user: { id: user.id } },
        });
        if (!specialist) {
          specialist = await specialists.save(
            specialists.create({
              user,
              bio: `Profesional en ${sub.name.toLowerCase()} con ${4 + (base % 12)} años de experiencia. Atención personalizada en consultorio.`,
              phone: phone(base),
              rtn: rtn(base),
              dni: dni(base),
              clinicAddress: `Barrio ${CITIES[base % CITIES.length]}, avenida principal, consultorio ${base + 1}`,
              appointmentDuration: duration,
              minAdvanceBooking: [1, 2, 4, 24][base % 4],
              status: SpecialistStatus.APPROVED,
              profilePicture: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
              subcategories: [{ id: sub.id }],
            }),
          );
          count('specialists (por subcategoría)');
        }

        const svc = await offeredServices.findOne({
          where: { specialist: { id: specialist.id }, specialty: sub.name },
        });
        if (!svc) {
          await offeredServices.save(
            offeredServices.create({
              specialist: { id: specialist.id },
              specialty: sub.name,
              specialties: serviceName,
              price,
              duration,
            }),
          );
          count('offered_services (por subcategoría)');
        }

        const dayOfWeek = base % 7;
        const [startTime, endTime] =
          SCHEDULE_WINDOWS[base % SCHEDULE_WINDOWS.length];
        const sched = await schedules.findOne({
          where: { specialist: { id: specialist.id }, dayOfWeek },
        });
        if (!sched) {
          await schedules.save(
            schedules.create({
              specialist: { id: specialist.id },
              dayOfWeek,
              startTime,
              endTime,
              isActive: true,
            }),
          );
          count('schedules (por subcategoría)');
        }
      }
    }
    console.log(
      `\nCategorías de la app: "${firstCategory.name}" -> ${subs.length} subcategorías, ${subs.length * MIN_PER_SUBCATEGORY} especialistas repartidos`,
    );
  }

  console.log('\nDatos de prueba creados:');
  for (const [key, value] of Object.entries(created)) {
    console.log(`  ${key}: ${value}`);
  }
  console.log(
    `\nUsuarios de prueba (contraseña: ${PASSWORD})\n  cliente: seed.cliente01@${EMAIL_DOMAIN}\n  especialista: seed.especialista01@${EMAIL_DOMAIN}`,
  );

  await dataSource.destroy();
};

seed().catch((error) => {
  console.error('Error al sembrar datos de prueba:', error);
  process.exit(1);
});

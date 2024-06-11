import { db } from "../../application/db.js";
import { bcryptPassword } from "../../helper/hashing.js";

async function main() {
  // Create Admin User
  const adminUser = await db.user.create({
    data: {
      name: "Admin",
      email: "admin@gmail.com",
      password: await bcryptPassword("rahasia"),
      role: "ADMIN",
    },
  });

  // Create Teacher Users
  const teacherUsers = await db.user.createMany({
    data: [
      {
        name: "Sinta",
        email: "sinta@gmail.com",
        password: await bcryptPassword("rahasia"),
        role: "TEACHER",
      },
      {
        name: "Alexa",
        email: "alexa@gmail.com",
        password: await bcryptPassword("rahasia"),
        role: "TEACHER",
      },
      {
        name: "Wulan",
        email: "wulan@gmail.com",
        password: await bcryptPassword("rahasia"),
        role: "TEACHER",
      },
    ],
  });

  // Create Teacher Records
  const teacher1 = await db.teacher.create({
    data: {
      nip: "1234567890",
      user: {
        connect: { email: "sinta@gmail.com" },
      },
    },
  });

  const teacher2 = await db.teacher.create({
    data: {
      nip: "0987654321",
      user: {
        connect: { email: "alexa@gmail.com" },
      },
    },
  });

  const teacher3 = await db.teacher.create({
    data: {
      nip: "1122334455",
      user: {
        connect: { email: "wulan@gmail.com" },
      },
    },
  });

  // Create Parent Users
  const parentUsers = await db.user.createMany({
    data: [
      {
        name: "Budi",
        email: "budi@gmail.com",
        password: await bcryptPassword("rahasia"),
        role: "PARENT",
      },
      {
        name: "Fandi",
        email: "fandi@gmail.com",
        password: await bcryptPassword("rahasia"),
        role: "PARENT",
      },
      {
        name: "Jono",
        email: "jono@gmail.com",
        password: await bcryptPassword("rahasia"),
        role: "PARENT",
      },
    ],
  });

  // Create Parent Records
  const parent1 = await db.parent.create({
    data: {
      user: {
        connect: { email: "budi@gmail.com" },
      },
    },
  });

  const parent2 = await db.parent.create({
    data: {
      user: {
        connect: { email: "fandi@gmail.com" },
      },
    },
  });

  const parent3 = await db.parent.create({
    data: {
      user: {
        connect: { email: "jono@gmail.com" },
      },
    },
  });

  // Create Classes
  const class1 = await db.class.create({
    data: {
      name: "Math 101",
      teacher: {
        connect: { id: teacher1.id },
      },
    },
  });

  const class2 = await db.class.create({
    data: {
      name: "Science 101",
      teacher: {
        connect: { id: teacher2.id },
      },
    },
  });

  const class3 = await db.class.create({
    data: {
      name: "History 101",
      teacher: {
        connect: { id: teacher3.id },
      },
    },
  });

  console.log("Database has been seeded with 1 admin, 3 parents, and 3 teachers. 🌱");
}
main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });

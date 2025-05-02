import { PrismaClient } from'@prisma/client';
import bcrypt from'bcryptjs';
import crypto from'crypto';
import { v4 as uuidv4 } from'uuid';

const prisma = new PrismaClient();

async function main() {
  try {
    const adminCount = await prisma.user.count({
      where: { role: 'admin' }
    });

    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('WM8542', salt);
      const adminId = uuidv4();
      const firstName = 'Admin';
      const lastName = 'User';
      const email = process.env.ADMIN_EMAIL || 'admin@example.com';
      const profilePhoto = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName)}&backgroundType=gradientLinear`;

      await prisma.user.create({
        data: {
          id: adminId,
          firstName,
          lastName,
          email,
          phoneNumber: process.env.ADMIN_PHONE || '+1234567890',
          profilePhoto,
          password: hashedPassword,
          role: 'admin',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      const admin = await prisma.user.findFirst({
        where: { role: 'admin' },
        select: { id: true }
      });

      const adminId = admin?.id || null;
      const password = await bcrypt.hash('Test123!', 10);

      await seedCourses();
      await seedClasses();
      await seedGlobalAttendanceConfig();
      await seedTestUsers(adminId, password);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedCourses() {
  const existingCoursesCount = await prisma.course.count();

  if (existingCoursesCount === 0) {
    await prisma.course.createMany({
      data: [
        {
          id: uuidv4(),
          name: 'SOD',
          description: 'Comprehensive training in modern software development practices including full-stack development, agile methodologies, and software architecture.',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          name: 'NET',
          description: 'Training in computer networking fundamentals, network administration, security, and infrastructure management.',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          name: 'MLTD',
          description: 'Training in digital media production including graphic design, video editing, animation, and multimedia content creation.',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]
    });
  }
}

async function seedClasses() {
  const existingClassesCount = await prisma.class.count();

  if (existingClassesCount === 0) {
    const classes = [];
    const levels = ['L3', 'L4', 'L5'];
    const sections = ['A', 'B'];
    const courseTypes = ['SOD', 'NET', 'MTD'];

    for (const courseType of courseTypes) {
      for (const level of levels) {
        for (const section of sections) {
          const icon = courseType === 'SOD' ? 'laptop-code' : 
                      courseType === 'NET' ? 'network-wired' : 
                      'photo-video';

          const color = courseType === 'SOD' ? 'blue' : 
                        courseType === 'NET' ? 'green' : 
                        'purple';

          const bgColor = `${color}-light`;

          classes.push({
            id: uuidv4(),
            name: `${level} ${courseType} ${section}`,
            level: level,
            section: section,
            description: `${courseType} class for ${level} students in section ${section}`,
            icon: icon,
            color: color,
            bgColor: bgColor,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    await prisma.class.createMany({
      data: classes
    });
  }
}

async function seedGlobalAttendanceConfig() {
  const existingConfigCount = await prisma.globalAttendanceConfig.count();

  if (existingConfigCount === 0) {
    await prisma.globalAttendanceConfig.create({
      data: {
        id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
}

async function seedTestUsers(createdBy, password) {
  const existingTestUsersCount = await prisma.user.count({
    where: {
      email: {
        endsWith: '@example.com'
      },
      role: {
        in: ['manager', 'mentor', 'staff']
      }
    }
  });

  if (existingTestUsersCount === 0) {
    const testUsers = [];
    const managerEmails = [
      'alex.johnson@example.com',
      'sarah.williams@example.com',
      'michael.brown@example.com'
    ];
    const mentorEmails = [
      'david.miller@example.com',
      'emma.davis@example.com',
      'james.wilson@example.com'
    ];
    const staffEmails = [
      'olivia.moore@example.com',
      'liam.taylor@example.com',
      'ava.anderson@example.com'
    ];

    const managers = generateUsers('manager', managerEmails, createdBy, password);
    const mentors = generateUsers('mentor', mentorEmails, createdBy, password);
    const staffUsers = generateUsers('staff', staffEmails, createdBy, password);

    testUsers.push(...managers, ...mentors, ...staffUsers);

    await prisma.user.createMany({
      data: testUsers
    });
  }
}

function generateUsers(role, emails, createdBy, password) {
  const genders = ['male', 'female', 'other', 'prefer_not_to_say'];
  const countries = ['United States', 'Canada', 'United Kingdom', 'Rwanda', 'South Africa'];
  const usCities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
  const rwandaDistricts = ['Kigali', 'Gasabo', 'Nyarugenge', 'Kicukiro', 'Rubavu'];
  const rwandaSectors = ['Gikondo', 'Kacyiru', 'Kimihurura', 'Remera', 'Gatsata'];

  const titles = {
    manager: ['Head Teacher', 'School Principal', 'Academic Director'],
    mentor: ['Senior Mentor', 'Educational Advisor', 'Learning Facilitator'],
    staff: ['Discipline Master', 'Operations Manager', 'Administrative Officer']
  };

  const users = [];

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    const firstName = email.split('.')[0];
    const lastName = email.split('.')[1].split('@')[0];
    const verificationToken = crypto.randomBytes(16).toString('hex');

    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - (18 + Math.floor(Math.random() * 47));
    const birthMonth = Math.floor(Math.random() * 12) + 1;
    const birthDay = Math.floor(Math.random() * 28) + 1;

    const dateOfBirth = new Date(birthYear, birthMonth - 1, birthDay);

    const gender = genders[Math.floor(Math.random() * genders.length)];

    const lastLogin = Math.random() > 0.3
      ? new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))
      : null;

    const country = countries[Math.floor(Math.random() * countries.length)];
    let city;
    let province;
    let district;
    let sector;
    let village;
    let road;
    let postalCode;

    if (country === 'Rwanda') {
      city = 'Kigali';
      province = 'Kigali';
      district = rwandaDistricts[Math.floor(Math.random() * rwandaDistricts.length)];
      sector = rwandaSectors[Math.floor(Math.random() * rwandaSectors.length)];
      village = `Village ${Math.floor(Math.random() * 20) + 1}`;
      road = `Street ${Math.floor(Math.random() * 100) + 1}`;
      postalCode = `P0${Math.floor(Math.random() * 9) + 1}`;
    } else {
      city = usCities[Math.floor(Math.random() * usCities.length)];
      province = ['California', 'Texas', 'New York', 'Florida', 'Illinois'][Math.floor(Math.random() * 5)];
      district = `District ${Math.floor(Math.random() * 10) + 1}`;
      sector = `Sector ${Math.floor(Math.random() * 10) + 1}`;
      village = '';
      road = `${['Main', 'Oak', 'Pine', 'Maple', 'Cedar'][Math.floor(Math.random() * 5)]} St`;
      postalCode = `${Math.floor(10000 + Math.random() * 90000)}`;
    }

    let profilePhoto;
    if (gender === 'female') {
      profilePhoto = `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}+${lastName}&hair=longHair,pixie&accessories=roundGlasses,kurt&facialHair=blank`;
    } else if (gender === 'male') {
      profilePhoto = `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}+${lastName}&hair=shortHair,balding&facialHair=beard,scruff&accessories=prescription02`;
    } else {
      profilePhoto = `https://api.dicebear.com/7.x/identicon/svg?seed=${firstName}+${lastName}`;
    }

    const bios = {
      manager: [
        `Experienced ${gender === 'female' ? 'female' : 'male'} manager with a proven track record.`,
        `Leadership-focused professional with ${Math.floor(Math.random() * 10) + 5} years in management.`,
        "Strategic thinker and team builder passionate about organizational growth."
      ],
      mentor: [
        "Dedicated mentor committed to helping others achieve their potential.",
        `${gender === 'female' ? 'She' : 'He'} has mentored ${Math.floor(Math.random() * 50) + 10} individuals.`,
        "Passionate about sharing knowledge and fostering professional development."
      ],
      staff: [
        "Detail-oriented team player with strong organizational skills.",
        `Reliable professional with expertise in ${['operations', 'customer service', 'administration'][Math.floor(Math.random() * 3)]}.`,
        `Committed to excellence in every task ${gender === 'female' ? 'she' : 'he'} undertakes.`
      ]
    };

    users.push({
      id: uuidv4(),
      firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
      lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
      email,
      phoneNumber: country === 'Rwanda'
        ? `+2507${Math.floor(80 + Math.random() * 20)}${Math.floor(100000 + Math.random() * 900000)}`
        : `+1${Math.floor(2000000000 + Math.random() * 8000000000)}`,
      profilePhoto,
      password,
      role,
      title: titles[role][Math.floor(Math.random() * titles[role].length)],
      verificationToken,
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isVerified: true,
      createdBy,
      lastLogin,
      dateOfBirth,
      gender,
      bio: bios[role][Math.floor(Math.random() * bios[role].length)],
      isEnabled: true,
      isPublic: Math.random() > 0.2,
      country,
      city,
      province,
      district,
      sector,
      village: country === 'Rwanda' ? village : '',
      road,
      postalCode,
      addressLine1: `${Math.floor(Math.random() * 9999) + 1} ${road}`,
      addressLine2: `${sector}, ${city}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  return users;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
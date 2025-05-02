import { PrismaClient } from '@prisma/client';
import { generateStudentId } from '../../utils/generateStudentId.js';

const prisma = new PrismaClient();

const generateProfileAvatar = (firstName, lastName, gender) => {
    const seed = `${firstName}+${lastName}`;
  
    switch (gender) {
        case 'female':
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&hair=longHairStraight&accessories=round&facialHair=blank`;
        case 'male':
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&hair=shortHairShortFlat&facialHair=beardMedium&accessories=prescription02`;
        default:
            return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;
    }
};

export const createStudent = async (studentData) => {
    const {
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth,
        gender,
        country,
        city,
        province,
        district,
        sector,
        village,
        road,
        postalCode,
        addressLine1,
        addressLine2,
        classId,
        courseId,
        profilePhoto 
    } = studentData;

    if (!firstName || !lastName || !email || !phoneNumber || !dateOfBirth || !gender || !classId || !courseId) {
        throw {
            status: 400,
            message: 'Missing required fields',
            requiredFields: ['firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 'gender', 'classId', 'courseId']
        };
    }

    const existingStudent = await prisma.student.findUnique({ where: { email } });
    if (existingStudent) {
        throw {
            status: 409,
            message: 'Email already exists',
            suggestion: 'Please use a different email address'
        };
    }

    const [classExists, courseExists] = await Promise.all([
        prisma.class.findUnique({ where: { id: classId } }),
        prisma.course.findUnique({ where: { id: courseId } })
    ]);

    if (!classExists) {
        throw {
            status: 404,
            message: 'Class not found'
        };
    }

    if (!courseExists) {
        throw {
            status: 404,
            message: 'Course not found'
        };
    }

    const today = new Date();
    const count = await prisma.student.count({
        where: {
            enrollmentDate: {
                gte: new Date(today.toDateString()),
            },
        },
    });

    const studentId = generateStudentId(today, count + 1);
    const studentProfilePhoto = profilePhoto || generateProfileAvatar(firstName, lastName, gender);

    return prisma.student.create({
        data: {
            firstName,
            lastName,
            email,
            profilePhoto: studentProfilePhoto,
            phoneNumber,
            dateOfBirth: new Date(dateOfBirth),
            gender,
            country,
            city,
            province,
            district,
            sector,
            village,
            road,
            postalCode,
            addressLine1,
            addressLine2,
            classId,
            courseId,
            studentId,
            enrollmentDate: today
        }
    });
};

export const getStudents = async (queryParams) => {
    const {
        page = 1,
        pageSize = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        country,
        city,
        province,
        district,
        sector,
        village,
        road,
        postalCode,
        gender,
        classId,
        courseId
    } = queryParams;

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(pageSize);
    const take = Number.parseInt(pageSize);

    const where = {};

    if (country) where.country = country;
    if (city) where.city = city;
    if (province) where.province = province;
    if (district) where.district = district;
    if (sector) where.sector = sector;
    if (village) where.village = village;
    if (road) where.road = road;
    if (postalCode) where.postalCode = postalCode;
    if (gender) where.gender = gender;
    if (classId) where.classId = classId;
    if (courseId) where.courseId = courseId;

    const [students, totalCount] = await Promise.all([
        prisma.student.findMany({
            where,
            orderBy: { [sortBy]: sortOrder.toLowerCase() },
            skip,
            take,
            include: {
                class: { select: { id: true, name: true } },
                course: { select: { id: true, name: true } }
            }
        }),
        prisma.student.count({ where })
    ]);

    return {
        students,
        pagination: {
            currentPage: Number.parseInt(page),
            pageSize: Number.parseInt(pageSize),
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / Number.parseInt(pageSize))
        }
    };
};

export const getStudent = async (id) => {
    const student = await prisma.student.findUnique({
        where: { id },
        include: {
            class: { select: { id: true, name: true } },
            course: { select: { id: true, name: true } }
        }
    });

    if (!student) {
        throw {
            status: 404,
            message: 'Student not found'
        };
    }

    return student;
};

export const getStudentsByClassId = async (classId, queryParams) => {
    const {
        page = 1,
        pageSize = 10,
        sortBy = 'firstName',
        sortOrder = 'asc',
        country,
        city,
        province,
        district,
        sector,
        village,
        road,
        postalCode,
        gender
    } = queryParams;

    if (!classId) {
        throw {
            status: 400,
            message: 'Class ID is required'
        };
    }

    const classExists = await prisma.class.findUnique({ where: { id: classId } });
    if (!classExists) {
        throw {
            status: 404,
            message: 'Class not found'
        };
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(pageSize);
    const take = Number.parseInt(pageSize);
    
    const where = { classId };

    if (country) where.country = country;
    if (city) where.city = city;
    if (province) where.province = province;
    if (district) where.district = district;
    if (sector) where.sector = sector;
    if (village) where.village = village;
    if (road) where.road = road;
    if (postalCode) where.postalCode = postalCode;
    if (gender) where.gender = gender;

    const [students, totalCount] = await Promise.all([
        prisma.student.findMany({
            where,
            orderBy: { [sortBy]: sortOrder.toLowerCase() },
            skip,
            take,
            include: {
                class: { select: { id: true, name: true } },
                course: { select: { id: true, name: true } }
            }
        }),
        prisma.student.count({ where })
    ]);

    return {
        students,
        classInfo: {
            id: classExists.id,
            name: classExists.name
        },
        pagination: {
            currentPage: Number.parseInt(page),
            pageSize: Number.parseInt(pageSize),
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / Number.parseInt(pageSize))
        }
    };
};

export const getStudentsByCourseId = async (courseId, queryParams) => {
    const {
        page = 1,
        pageSize = 10,
        sortBy = 'firstName',
        sortOrder = 'asc',
        country,
        city,
        province,
        district,
        sector,
        village,
        road,
        postalCode,
        gender,
        classId
    } = queryParams;

    if (!courseId) {
        throw {
            status: 400,
            message: 'Course ID is required'
        };
    }

    const courseExists = await prisma.course.findUnique({ where: { id: courseId } });
    if (!courseExists) {
        throw {
            status: 404,
            message: 'Course not found'
        };
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(pageSize);
    const take = Number.parseInt(pageSize);
    
    const where = { courseId };

    if (country) where.country = country;
    if (city) where.city = city;
    if (province) where.province = province;
    if (district) where.district = district;
    if (sector) where.sector = sector;
    if (village) where.village = village;
    if (road) where.road = road;
    if (postalCode) where.postalCode = postalCode;
    if (gender) where.gender = gender;
    if (classId) where.classId = classId;

    const [students, totalCount] = await Promise.all([
        prisma.student.findMany({
            where,
            orderBy: { [sortBy]: sortOrder.toLowerCase() },
            skip,
            take,
            include: {
                class: { select: { id: true, name: true } },
                course: { select: { id: true, name: true } }
            }
        }),
        prisma.student.count({ where })
    ]);

    return {
        students,
        courseInfo: {
            id: courseExists.id,
            name: courseExists.name
        },
        pagination: {
            currentPage: Number.parseInt(page),
            pageSize: Number.parseInt(pageSize),
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / Number.parseInt(pageSize))
        }
    };
};

export const searchStudents = async (queryParams) => {
    const {
        search = '',
        page = 1,
        pageSize = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = queryParams;

    if (!search.trim()) {
        throw {
            status: 400,
            message: 'Search query cannot be empty'
        };
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(pageSize);
    const take = Number.parseInt(pageSize);
    
    const where = {
        OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phoneNumber: { contains: search, mode: 'insensitive' } },
            { studentId: { contains: search, mode: 'insensitive' } }
        ]
    };

    const [students, totalCount] = await Promise.all([
        prisma.student.findMany({
            where,
            orderBy: { [sortBy]: sortOrder.toLowerCase() },
            skip,
            take,
            include: {
                class: { select: { id: true, name: true } },
                course: { select: { id: true, name: true } }
            }
        }),
        prisma.student.count({ where })
    ]);

    return {
        students,
        pagination: {
            currentPage: Number.parseInt(page),
            pageSize: Number.parseInt(pageSize),
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / Number.parseInt(pageSize))
        }
    };
};

export const updateStudent = async (id, studentData) => {
    const student = await prisma.student.findUnique({
        where: { id }
    });

    if (!student) {
        throw {
            status: 404,
            message: 'Student not found'
        };
    }

    const {
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth,
        gender,
        country,
        city,
        province,
        district,
        sector,
        village,
        road,
        postalCode,
        addressLine1,
        addressLine2,
        classId,
        courseId,
        profilePhoto,
        isActive
    } = studentData;

    if (email && email !== student.email) {
        const emailExists = await prisma.student.findFirst({
            where: {
                email,
                id: { not: id }
            }
        });

        if (emailExists) {
            throw {
                status: 409,
                message: 'Email already exists',
                suggestion: 'Please use a different email address'
            };
        }
    }

    if (classId) {
        const classExists = await prisma.class.findUnique({ where: { id: classId } });
        if (!classExists) {
            throw {
                status: 404,
                message: 'Class not found'
            };
        }
    }

    if (courseId) {
        const courseExists = await prisma.course.findUnique({ where: { id: courseId } });
        if (!courseExists) {
            throw {
                status: 404,
                message: 'Course not found'
            };
        }
    }

    const updatedData = {
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        country,
        city,
        province,
        district,
        sector,
        village,
        road,
        postalCode,
        addressLine1,
        addressLine2,
        classId,
        courseId,
        isActive
    };

    if (profilePhoto) {
        updatedData.profilePhoto = profilePhoto;
    } else if (firstName && lastName && gender && !student.profilePhoto) {
        updatedData.profilePhoto = generateProfileAvatar(firstName, lastName, gender);
    }

    return prisma.student.update({
        where: { id },
        data: updatedData,
        include: {
            class: { select: { id: true, name: true } },
            course: { select: { id: true, name: true } }
        }
    });
};

export const deleteStudent = async (id) => {
    const student = await prisma.student.findUnique({
        where: { id },
        include: { attendances: { select: { id: true } } }
    });

    if (!student) {
        throw {
            status: 404,
            message: 'Student not found'
        };
    }

    if (student.attendances.length > 0) {
        await prisma.attendance.deleteMany({
            where: { studentId: student.studentId }
        });
    }

    return prisma.student.delete({
        where: { id }
    });
};

export const getStudentByCardId = async (cardId) => {
    const student = await prisma.student.findUnique({
        where: { cardId },
        include: {
            class: { select: { id: true, name: true } },
            course: { select: { id: true, name: true } }
        }
    });

    if (!student) {
        throw {
            status: 404,
            message: 'Student card not found'
        };
    }

    return student;
};
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllCourses = async (queryParams) => {
    const {
        page = 1,
        pageSize = 10,
        sortBy = 'name',
        sortOrder = 'asc',
        name,
    } = queryParams;

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(pageSize);
    const take = Number.parseInt(pageSize);

    const where = {};
    if (name) where.name = { contains: name, mode: 'insensitive' };

    const [courses, totalCount] = await Promise.all([
        prisma.course.findMany({
            where,
            include: {
                students: {
                    select: {
                        id: true,
                        gender: true
                    }
                }
            },
            orderBy: { [sortBy]: sortOrder.toLowerCase() },
            skip,
            take
        }),
        prisma.course.count({ where })
    ]);

    const formattedCourses = courses.map(course => {
        const totalStudents = course.students.length;
        const maleStudents = course.students.filter(student => student.gender === 'male').length;
        const femaleStudents = course.students.filter(student => student.gender === 'female').length;

        return {
            id: course.id,
            name: course.name,
            description: course.description,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
            studentStats: {
                total: totalStudents,
                male: maleStudents,
                female: femaleStudents
            }
        };
    });

    return {
        courses: formattedCourses,
        pagination: {
            currentPage: Number.parseInt(page),
            pageSize: Number.parseInt(pageSize),
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / Number.parseInt(pageSize))
        }
    };
};

export const getCourse = async (id) => {
    const course = await prisma.course.findUnique({
        where: { id },
        include: {
            students: {
                select: {
                    id: true,
                    gender: true
                }
            }
        }
    });

    if (!course) {
        throw {
            status: 404,
            message: 'Course not found'
        };
    }

    const totalStudents = course.students.length;
    const maleStudents = course.students.filter(student => student.gender === 'male').length;
    const femaleStudents = course.students.filter(student => student.gender === 'female').length;

    return {
        id: course.id,
        name: course.name,
        description: course.description,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        studentStats: {
            total: totalStudents,
            male: maleStudents,
            female: femaleStudents
        }
    };
};

export const createCourse = async (courseData) => {
    const { name, description } = courseData;

    if (!name) {
        throw {
            status: 400,
            message: 'Course name is required',
            requiredFields: ['name']
        };
    }

    const existingCourse = await prisma.course.findFirst({
        where: { name }
    });

    if (existingCourse) {
        throw {
            status: 409,
            message: 'A course with this name already exists',
            suggestion: 'Please choose a different name'
        };
    }

    return prisma.course.create({
        data: {
            name,
            description
        }
    });
};

export const updateCourse = async (id, courseData) => {
    const { name, description } = courseData;

    const courseExists = await prisma.course.findUnique({
        where: { id }
    });

    if (!courseExists) {
        throw {
            status: 404,
            message: 'Course not found'
        };
    }

    if (name && name !== courseExists.name) {
        const nameExists = await prisma.course.findFirst({
            where: {
                name,
                id: { not: id }
            }
        });

        if (nameExists) {
            throw {
                status: 409,
                message: 'A course with this name already exists',
                suggestion: 'Please choose a different name'
            };
        }
    }

    return prisma.course.update({
        where: { id },
        data: {
            name,
            description
        }
    });
};

export const deleteCourse = async (id) => {
    const courseExists = await prisma.course.findUnique({
        where: { id },
        include: { students: { select: { id: true } } }
    });

    if (!courseExists) {
        throw {
            status: 404,
            message: 'Course not found'
        };
    }

    if (courseExists.students.length > 0) {
        throw {
            status: 400,
            message: 'Cannot delete course with enrolled students',
            suggestion: 'Transfer students to another course before deletion'
        };
    }

    return prisma.course.delete({
        where: { id }
    });
};
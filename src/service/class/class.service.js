import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllClasses = async (queryParams) => {
    const {
        page = 1,
        pageSize = 10,
        sortBy = 'name',
        sortOrder = 'asc',
        section,
        level,
        name,
    } = queryParams;

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(pageSize);
    const take = Number.parseInt(pageSize);

    const where = {};
    if (section) where.section = section;
    if (level) where.level = level;
    if (name) where.name = { contains: name, mode: 'insensitive' };

    const [classes, totalCount] = await Promise.all([
        prisma.class.findMany({
            where,
            orderBy: { [sortBy]: sortOrder.toLowerCase() },
            skip,
            take
        }),
        prisma.class.count({ where })
    ]);

    return {
        classes,
        pagination: {
            currentPage: Number.parseInt(page),
            pageSize: Number.parseInt(pageSize),
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / Number.parseInt(pageSize))
        }
    };
};

export const getAllClassesWithStats = async (queryParams) => {
    const {
        page = 1,
        pageSize = 10,
        sortBy = 'name',
        sortOrder = 'asc',
        section,
        level,
        name,
    } = queryParams;

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(pageSize);
    const take = Number.parseInt(pageSize);

    const where = {};
    if (section) where.section = section;
    if (level) where.level = level;
    if (name) where.name = { contains: name, mode: 'insensitive' };

    const [classes, totalCount] = await Promise.all([
        prisma.class.findMany({
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
        prisma.class.count({ where })
    ]);

    const formattedClasses = classes.map(cls => {
        const totalStudents = cls.students.length;
        const males = cls.students.filter(student => student.gender === 'male').length;
        const females = cls.students.filter(student => student.gender === 'female').length;

        return {
            id: cls.id,
            name: cls.name,
            description: cls.description,
            color: cls.color,
            bgColor: cls.bgColor,
            section: cls.section,
            level: cls.level,
            icon: cls.icon,
            createdAt: cls.createdAt,
            updatedAt: cls.updatedAt,
            studentStatistics: {
                totalStudents,
                males,
                females,
                malePercentage: totalStudents > 0 ? Math.round((males / totalStudents) * 100) : 0,
                femalePercentage: totalStudents > 0 ? Math.round((females / totalStudents) * 100) : 0
            }
        };
    });

    return {
        classes: formattedClasses,
        pagination: {
            currentPage: Number.parseInt(page),
            pageSize: Number.parseInt(pageSize),
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / Number.parseInt(pageSize))
        }
    };
};

export const getClass = async (id) => {
    const cls = await prisma.class.findUnique({
        where: { id },
    });

    if (!cls) {
        throw {
            status: 404,
            message: 'Class not found'
        };
    }

    return cls;
};

export const getClassWithStats = async (id) => {
    const cls = await prisma.class.findUnique({
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

    if (!cls) {
        throw {
            status: 404,
            message: 'Class not found'
        };
    }

    const totalStudents = cls.students.length;
    const males = cls.students.filter(student => student.gender === 'male').length;
    const females = cls.students.filter(student => student.gender === 'female').length;

    return {
        id: cls.id,
        name: cls.name,
        description: cls.description,
        color: cls.color,
        bgColor: cls.bgColor,
        section: cls.section,
        level: cls.level,
        icon: cls.icon,
        createdAt: cls.createdAt,
        updatedAt: cls.updatedAt,
        studentStatistics: {
            totalStudents,
            males,
            females,
            malePercentage: totalStudents > 0 ? Math.round((males / totalStudents) * 100) : 0,
            femalePercentage: totalStudents > 0 ? Math.round((females / totalStudents) * 100) : 0
        }
    };
};

export const createClass = async (classData) => {
    const { name, description, level, section, icon, color, bgColor } = classData;

    if (!name) {
        throw {
            status: 400,
            message: 'Class name is required',
            requiredFields: ['name']
        };
    }

    const existingClass = await prisma.class.findFirst({
        where: { name }
    });

    if (existingClass) {
        throw {
            status: 409,
            message: 'A class with this name already exists',
            suggestion: 'Please choose a different name'
        };
    }

    return prisma.class.create({
        data: {
            name,
            description,
            level,
            section,
            icon: icon || 'computer',
            color: color || 'blue',
            bgColor
        }
    });
};

export const updateClass = async (id, classData) => {
    const { name, description, level, section, icon, color, bgColor } = classData;

    const classExists = await prisma.class.findUnique({
        where: { id }
    });

    if (!classExists) {
        throw {
            status: 404,
            message: 'Class not found'
        };
    }

    if (name && name !== classExists.name) {
        const nameExists = await prisma.class.findFirst({
            where: {
                name,
                id: { not: id }
            }
        });

        if (nameExists) {
            throw {
                status: 409,
                message: 'A class with this name already exists',
                suggestion: 'Please choose a different name'
            };
        }
    }

    return prisma.class.update({
        where: { id },
        data: {
            name,
            description,
            level,
            section,
            icon,
            color,
            bgColor
        }
    });
};

export const deleteClass = async (id) => {
    const classExists = await prisma.class.findUnique({
        where: { id },
        include: { students: { select: { id: true } } }
    });

    if (!classExists) {
        throw {
            status: 404,
            message: 'Class not found'
        };
    }

    if (classExists.students.length > 0) {
        throw {
            status: 400,
            message: 'Cannot delete class with enrolled students',
            suggestion: 'Transfer students to another class before deletion'
        };
    }

    return prisma.class.delete({
        where: { id }
    });
};
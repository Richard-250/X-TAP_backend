import db from '../../database/models/index.js';
const { Class, Student } = db;

// Get all classes with student statistics
export const getAllClassesWithStats = async (queryParams) => {
    const {
        page = 1,
        pageSize = 10,
        sortBy = 'name',
        sortOrder = 'ASC',
        section,
        level,
        name, 
    } = queryParams;

    const offset = (page - 1) * pageSize;

    // Build where clause if section filter is provided
    const where = {};
    if (section) where.section = section;
    if (level) where.level = level;
    if (name) where.name = name;

    // Get classes with statistics in a single optimized query
    const classes = await Class.findAll({
        attributes: [
            'id',
            'name',
            'description',
            'color',
            'bgColor',
            'section',
            'icon',
            'createdAt',
            'updatedAt',
            [db.sequelize.fn('COUNT', db.sequelize.col('Students.id')), 'totalStudents'],
            [db.sequelize.literal(`SUM(CASE WHEN "Students"."gender" = 'male' THEN 1 ELSE 0 END)`), 'males'],
            [db.sequelize.literal(`SUM(CASE WHEN "Students"."gender" = 'female' THEN 1 ELSE 0 END)`), 'females']
        ],
        where,
        include: [{
            model: Student,
            attributes: [],
            required: false
        }],
        group: ['Class.id'],
        order: [[sortBy, sortOrder]],
        limit: parseInt(pageSize),
        offset: offset,
        subQuery: false
    });

    // Get total count for pagination (considering section filter)
    const totalCount = await Class.count({ where });

    // Format the response
    const formattedClasses = classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        description: cls.description,
        color: cls.color,
        bgColor: cls.bgColor,
        section: cls.section,
        icon: cls.icon,
        createdAt: cls.createdAt,
        updatedAt: cls.updatedAt,
        studentStatistics: {
            totalStudents: cls.get('totalStudents'),
            males: cls.get('males'),
            females: cls.get('females'),
            malePercentage: cls.get('totalStudents') > 0 
                ? Math.round((cls.get('males') / cls.get('totalStudents')) * 100) 
                : 0,
            femalePercentage: cls.get('totalStudents') > 0 
                ? Math.round((cls.get('females') / cls.get('totalStudents')) * 100) 
                : 0
        }
    }));

    return {
        classes: formattedClasses,
        pagination: {
            currentPage: parseInt(page),
            pageSize: parseInt(pageSize),
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / pageSize)
        }
    };
};

// Get a single class with student statistics
export const getClassWithStats = async (classId) => {
    // Get the class with statistics in a single optimized query
    const cls = await Class.findOne({
        attributes: [
            'id',
            'name',
            'description',
            'color',
            'bgColor',
            'section',
            'icon',
            'createdAt',
            'updatedAt',
            [db.sequelize.fn('COUNT', db.sequelize.col('Students.id')), 'totalStudents'],
            [db.sequelize.literal(`SUM(CASE WHEN "Students"."gender" = 'male' THEN 1 ELSE 0 END)`), 'males'],
            [db.sequelize.literal(`SUM(CASE WHEN "Students"."gender" = 'female' THEN 1 ELSE 0 END)`), 'females']
        ],
        where: { id: classId },
        include: [{
            model: Student,
            attributes: [],
            required: false
        }],
        group: ['Class.id']
    });

    if (!cls) {
        throw {
            status: 404,
            message: 'Class not found'
        };
    }

    // Format the response
    return {
        id: cls.id,
        name: cls.name,
        description: cls.description,
        color: cls.color,
        bgColor: cls.bgColor,
        section: cls.section,
        icon: cls.icon,
        createdAt: cls.createdAt,
        updatedAt: cls.updatedAt,
        studentStatistics: {
            totalStudents: cls.get('totalStudents'),
            males: cls.get('males'),
            females: cls.get('females'),
            malePercentage: cls.get('totalStudents') > 0 
                ? Math.round((cls.get('males') / cls.get('totalStudents')) * 100) 
                : 0,
            femalePercentage: cls.get('totalStudents') > 0 
                ? Math.round((cls.get('females') / cls.get('totalStudents')) * 100) 
                : 0
        }
    };
};
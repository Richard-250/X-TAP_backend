import db from '../../database/models/index.js';
const { Course } = db;

// Get all courses with student statistics
export const getAllCourses = async (queryParams) => {
    const {
        page = 1,
        pageSize = 10,
        sortBy = 'name',
        sortOrder = 'ASC',
        name,
    } = queryParams;

    const offset = (page - 1) * pageSize;

    // Build where clause
    const where = {};
    if (name) where.name = { [db.Sequelize.Op.iLike]: `%${name}%` };

    // Base attributes
    const attributes = [
        'id',
        'name',
        'description',
        'createdAt',
        'updatedAt'
    ];

    const options = {
        attributes: [
            ...attributes,
            [
              db.Sequelize.literal(`(
                SELECT COUNT(*)
                FROM "students" AS "student"
                WHERE "student"."courseId" = "Course"."id"
              )`),
              'totalStudents'
            ],
            [
              db.Sequelize.literal(`(
                SELECT COUNT(*)
                FROM "students" AS "student"
                WHERE "student"."courseId" = "Course"."id"
                AND "student"."gender" = 'male'
              )`),
              'maleStudents'
            ],
            [
              db.Sequelize.literal(`(
                SELECT COUNT(*)
                FROM "students" AS "student"
                WHERE "student"."courseId" = "Course"."id"
                AND "student"."gender" = 'female'
              )`),
              'femaleStudents'
            ]
          ],              
        where,
        order: [[sortBy, sortOrder]],
        limit: parseInt(pageSize),
        offset: offset,
        subQuery: false
    };

    const courses = await Course.findAll(options);

    // Get total count for pagination
    const totalCount = await Course.count({ where });

    // Format the response
    const formattedCourses = courses.map(course => ({
        id: course.id,
        name: course.name,
        description: course.description,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        studentStats: {
            total: course.getDataValue('totalStudents') || 0,
            male: course.getDataValue('maleStudents') || 0,
            female: course.getDataValue('femaleStudents') || 0
        }
    }));

    return {
        courses: formattedCourses,
        pagination: {
            currentPage: parseInt(page),
            pageSize: parseInt(pageSize),
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / pageSize)
        }
    };
};

// Get a single course with student statistics
export const getCourse = async (courseId) => {
    // Base attributes
    const attributes = [
        'id',
        'name',
        'description',
        'createdAt',
        'updatedAt'
    ];

    const options = {
        attributes: [
            ...attributes,
            [
              db.Sequelize.literal(`(
                SELECT COUNT(*)
                FROM "students" AS "student"
                WHERE "student"."courseId" = "Course"."id"
              )`),
              'totalStudents'
            ],
            [
              db.Sequelize.literal(`(
                SELECT COUNT(*)
                FROM "students" AS "student"
                WHERE "student"."courseId" = "Course"."id"
                AND "student"."gender" = 'male'
              )`),
              'maleStudents'
            ],
            [
              db.Sequelize.literal(`(
                SELECT COUNT(*)
                FROM "students" AS "student"
                WHERE "student"."courseId" = "Course"."id"
                AND "student"."gender" = 'female'
              )`),
              'femaleStudents'
            ]
          ],
        where: { id: courseId }
    };

    const course = await Course.findOne(options);

    if (!course) {
        throw {
            status: 404,
            message: 'Course not found'
        };
    }

    // Format the response
    return {
        id: course.id,
        name: course.name,
        description: course.description,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        studentStats: {
            total: course.getDataValue('totalStudents') || 0,
            male: course.getDataValue('maleStudents') || 0,
            female: course.getDataValue('femaleStudents') || 0
        }
    };
};
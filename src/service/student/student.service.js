import db from '../../database/models/index.js';
import { Op } from 'sequelize';
const { Student, Class, Course } = db;
import { generateStudentId } from '../../utils/generateStudentId.js';

// Function to generate profile avatar based on name and gender
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

// Student registration service
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

    // Validate required fields
    if (!firstName || !lastName || !email || !phoneNumber || !dateOfBirth || !gender || !classId || !courseId) {
        throw {
            status: 400,
            message: 'Missing required fields',
            requiredFields: ['firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 'gender', 'classId', 'courseId']
        };
    }

    // Check if student email already exists
    const existingStudent = await Student.findOne({ where: { email } });
    if (existingStudent) {
        throw {
            status: 409,
            message: 'Email already exists',
            suggestion: 'Please use a different email address'
        };
    }

    // Validate if classId and courseId exist
    const [classExists, courseExists] = await Promise.all([
        Class.findByPk(classId),
        Course.findByPk(courseId)
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

    // Generate default avatar if profilePhoto is not provided
    const studentProfilePhoto = profilePhoto || generateProfileAvatar(firstName, lastName, gender);
    
    // Generate a unique student ID
    const studentId = await generateStudentId();

    // Create the student
    const newStudent = await Student.create({
        firstName,
        lastName,
        email,
        profilePhoto: studentProfilePhoto,
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
        studentId,
    });

    return newStudent;
};

// Get all students with filtering, sorting, and pagination
export const getStudents = async (queryParams) => {
    const {
        page = 1,
        pageSize = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        // Address filters
        country,
        city,
        province,
        district,
        sector,
        village,
        road,
        postalCode,
        // Student filters
        gender,
        classId,
        courseId
    } = queryParams;

    // Calculate pagination offset
    const offset = (page - 1) * pageSize;

    // Build the where clause for filtering
    const where = {};

    // Address filters
    if (country) where.country = country;
    if (city) where.city = city;
    if (province) where.province = province;
    if (district) where.district = district;
    if (sector) where.sector = sector;
    if (village) where.village = village;
    if (road) where.road = road;
    if (postalCode) where.postalCode = postalCode;

    // Student filters
    if (gender) where.gender = gender;
    if (classId) where.classId = classId;
    if (courseId) where.courseId = courseId;

    // Get total count for pagination info
    const totalCount = await Student.count({ where });

    // Fetch students with filters, sorting, and pagination
    const students = await Student.findAll({
        where,
        order: [[sortBy, sortOrder]],
        limit: parseInt(pageSize),
        offset: offset,
        include: [
            { model: Class, attributes: ['id', 'name'] },
            { model: Course, attributes: ['id', 'name'] }
        ]
    });

    return {
        students,
        pagination: {
            currentPage: parseInt(page),
            pageSize: parseInt(pageSize),
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / pageSize)
        }
    };
};

// Get students by class ID
export const getStudentsByClassId = async (classId, queryParams) => {
    const {
        page = 1,
        pageSize = 10,
        sortBy = 'firstName',
        sortOrder = 'ASC',
        // Address filters
        country,
        city,
        province,
        district,
        sector,
        village,
        road,
        postalCode,
        // Student filters
        gender
    } = queryParams;

    // Validate classId
    if (!classId) {
        throw {
            status: 400,
            message: 'Class ID is required'
        };
    }

    // Check if class exists
    const classExists = await Class.findByPk(classId);
    if (!classExists) {
        throw {
            status: 404,
            message: 'Class not found'
        };
    }

    const offset = (page - 1) * pageSize;
    const where = { classId };

    // Apply address filters if provided
    if (country) where.country = country;
    if (city) where.city = city;
    if (province) where.province = province;
    if (district) where.district = district;
    if (sector) where.sector = sector;
    if (village) where.village = village;
    if (road) where.road = road;
    if (postalCode) where.postalCode = postalCode;

    // Apply student filters if provided
    if (gender) where.gender = gender;

    // Get total count for pagination
    const totalCount = await Student.count({ where });

    // Fetch students in the same class
    const students = await Student.findAll({
        where,
        order: [[sortBy, sortOrder]],
        limit: parseInt(pageSize),
        offset: offset,
        include: [
            { model: Class, attributes: ['id', 'name'] },
            { model: Course, attributes: ['id', 'name'] }
        ]
    });

    return {
        students,
        classInfo: {
            id: classExists.id,
            name: classExists.name
        },
        pagination: {
            currentPage: parseInt(page),
            pageSize: parseInt(pageSize),
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / pageSize)
        }
    };
};

// Get students by course ID
export const getStudentsByCourseId = async (courseId, queryParams) => {
    const {
        page = 1,
        pageSize = 10,
        sortBy = 'firstName',
        sortOrder = 'ASC',
        // Address filters
        country,
        city,
        province,
        district,
        sector,
        village,
        road,
        postalCode,
        // Student filters
        gender,
        classId
    } = queryParams;

    // Validate courseId
    if (!courseId) {
        throw {
            status: 400,
            message: 'Course ID is required'
        };
    }

    // Check if course exists
    const courseExists = await Course.findByPk(courseId);
    if (!courseExists) {
        throw {
            status: 404,
            message: 'Course not found'
        };
    }

    const offset = (page - 1) * pageSize;
    const where = { courseId };

    // Apply address filters if provided
    if (country) where.country = country;
    if (city) where.city = city;
    if (province) where.province = province;
    if (district) where.district = district;
    if (sector) where.sector = sector;
    if (village) where.village = village;
    if (road) where.road = road;
    if (postalCode) where.postalCode = postalCode;

    // Apply student filters if provided
    if (gender) where.gender = gender;
    if (classId) where.classId = classId;

    // Get total count for pagination
    const totalCount = await Student.count({ where });

    // Fetch students taking the same course
    const students = await Student.findAll({
        where,
        order: [[sortBy, sortOrder]],
        limit: parseInt(pageSize),
        offset: offset,
        include: [
            { model: Class, attributes: ['id', 'name'] },
            { model: Course, attributes: ['id', 'name'] }
        ]
    });

    return {
        students,
        courseInfo: {
            id: courseExists.id,
            name: courseExists.name
        },
        pagination: {
            currentPage: parseInt(page),
            pageSize: parseInt(pageSize),
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / pageSize)
        }
    };
};

// Search students
export const searchStudents = async (queryParams) => {
    const {
        search = '',
        page = 1,
        pageSize = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
    } = queryParams;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    if (!search.trim()) {
        throw {
            status: 400,
            message: 'Search query cannot be empty'
        };
    }

    const searchTerm = `%${search.trim()}%`;

    const where = {
        [Op.or]: [
            { firstName: { [Op.iLike]: searchTerm } },
            { lastName: { [Op.iLike]: searchTerm } },
            { email: { [Op.iLike]: searchTerm } },
            { phoneNumber: { [Op.iLike]: searchTerm } }
        ]
    };

    const totalItems = await Student.count({ where });

    const students = await Student.findAll({
        where,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(pageSize),
        offset,
        include: [
            { model: Class, attributes: ['id', 'name'] },
            { model: Course, attributes: ['id', 'name'] }
        ]
    });

    return {
        students,
        pagination: {
            currentPage: parseInt(page),
            pageSize: parseInt(pageSize),
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize)
        }
    };
};
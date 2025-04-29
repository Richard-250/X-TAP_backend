import * as courseService from '../service/index.service.js';



export const getAllCourses = async (req, res) => {
    try {
        const result = await courseService.getAllCourses(req.query);
        
        return res.status(200).json({
            success: true,
            message: 'Courses retrieved successfully',
            data: result.courses,
            pagination: result.pagination
        });
    } catch (error) {
        const status = error.status || 500;
        
        return res.status(status).json({
            success: false,
            message: error.message || 'An error occurred while fetching courses',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
};


export const getSingleCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const courseData = await courseService.getCourse(id);
        
        return res.status(200).json({
            success: true,
            message: 'Course retrieved successfully',
            data: courseData
        });
    } catch (error) {
        const status = error.status || 500;
        
        return res.status(status).json({
            success: false,
            message: error.message || 'An error occurred while fetching the course',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
};
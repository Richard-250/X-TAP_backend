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

export const createCourse = async (req, res) => {
    try {
        const newCourse = await courseService.createCourse(req.body);
        
        return res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: newCourse
        });
    } catch (error) {
        const status = error.status || 500;
        
        const response = {
            success: false,
            message: error.message || 'An error occurred while creating the course'
        };
        
        if (error.requiredFields) {
            response.requiredFields = error.requiredFields;
        }
        
        if (error.suggestion) {
            response.suggestion = error.suggestion;
        }
        
        if (process.env.NODE_ENV === 'development' && status === 500) {
            response.error = error.toString();
        }
        
        return res.status(status).json(response);
    }
};

export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCourse = await courseService.updateCourse(id, req.body);
        
        return res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: updatedCourse
        });
    } catch (error) {
        const status = error.status || 500;
        
        return res.status(status).json({
            success: false,
            message: error.message || 'An error occurred while updating the course',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        await courseService.deleteCourse(id);
        
        return res.status(200).json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        const status = error.status || 500;
        
        return res.status(status).json({
            success: false,
            message: error.message || 'An error occurred while deleting the course',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
};
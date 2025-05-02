import * as classService from '../service/index.service.js';

export const getAllClasses = async (req, res) => {
    try {
        const result = await classService.getAllClasses(req.query);
        
        return res.status(200).json({
            success: true,
            message: 'Classes retrieved successfully',
            data: result.classes,
            pagination: result.pagination
        });
    } catch (error) {
        const status = error.status || 500;
        
        return res.status(status).json({
            success: false,
            message: error.message || 'An error occurred while fetching classes',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
};

export const getAllClassesWithStats = async (req, res) => {
    try {
        const result = await classService.getAllClassesWithStats(req.query);
        
        return res.status(200).json({
            success: true,
            message: 'Classes with student statistics retrieved successfully',
            data: result.classes,
            pagination: result.pagination
        });
    } catch (error) {
        const status = error.status || 500;
        
        return res.status(status).json({
            success: false,
            message: error.message || 'An error occurred while fetching classes with statistics',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
};

export const getSingleClass = async (req, res) => {
    try {
        const { id } = req.params;
        const classData = await classService.getClass(id);
        
        return res.status(200).json({
            success: true,
            message: 'Class retrieved successfully',
            data: classData
        });
    } catch (error) {
        const status = error.status || 500;
        
        return res.status(status).json({
            success: false,
            message: error.message || 'An error occurred while fetching the class',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
};

export const getSingleClassWithStats = async (req, res) => {
    try {
        const { id } = req.params;
        const classData = await classService.getClassWithStats(id);
        
        return res.status(200).json({
            success: true,
            message: 'Class with student statistics retrieved successfully',
            data: classData
        });
    } catch (error) {
        const status = error.status || 500;
        
        return res.status(status).json({
            success: false,
            message: error.message || 'An error occurred while fetching class with statistics',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
};

export const createClass = async (req, res) => {
    try {
        const newClass = await classService.createClass(req.body);
        
        return res.status(201).json({
            success: true,
            message: 'Class created successfully',
            data: newClass
        });
    } catch (error) {
        const status = error.status || 500;
        
        const response = {
            success: false,
            message: error.message || 'An error occurred while creating the class'
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

export const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedClass = await classService.updateClass(id, req.body);
        
        return res.status(200).json({
            success: true,
            message: 'Class updated successfully',
            data: updatedClass
        });
    } catch (error) {
        const status = error.status || 500;
        
        return res.status(status).json({
            success: false,
            message: error.message || 'An error occurred while updating the class',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
};

export const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        await classService.deleteClass(id);
        
        return res.status(200).json({
            success: true,
            message: 'Class deleted successfully'
        });
    } catch (error) {
        const status = error.status || 500;
        
        return res.status(status).json({
            success: false,
            message: error.message || 'An error occurred while deleting the class',
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
};
import * as classService from '../service/index.service.js';

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

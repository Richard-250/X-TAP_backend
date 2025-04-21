import Joi from "joi";

const roleUpdateSchema = Joi.object({
    userId: Joi.string()
        .guid({ version: 'uuidv4' })
        .required()
        .messages({
            'string.guid': 'User ID must be a valid UUID',
            'any.required': 'User ID is required'
        }),
    newRole: Joi.string()
        .valid('accountant', 'mentor', 'staff')
        .required()
        .messages({
            'any.only': 'Role must be one of: accountant, mentor, staff',
            'any.required': 'Role is required'
        })
});

const validateRoleUpdate = (req, res, next) => {
    const { error } = roleUpdateSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errors = error.details.map(err => ({
            field: err.context.key,
            message: err.message
        }));
        return res.status(400).json({ errors });
    }
    next();
};

export default validateRoleUpdate;
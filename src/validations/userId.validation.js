import Joi from "joi";

const userIdSchema = Joi.object({
    userId: Joi.string()
        .guid({ version: 'uuidv4' })
        .required()
        .messages({
            'string.guid': 'User ID must be a valid UUID',
            'any.required': 'User ID is required'
        })
});

const validateUserId = (req, res, next) => {
    const { error } = userIdSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errors = error.details.map(err => ({
            field: err.context.key,
            message: err.message
        }));
        return res.status(400).json({ errors });
    }
    next();
};

export default validateUserId;
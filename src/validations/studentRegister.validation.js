import Joi from "joi";

const studentRegistrationSchema = Joi.object({
    firstName: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.empty': 'First name cannot be empty',
            'string.min': 'First name should have at least {#limit} characters',
            'string.max': 'First name should not exceed {#limit} characters',
            'any.required': 'First name is required'
        }),
    lastName: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Last name cannot be empty',
            'string.min': 'Last name should have at least {#limit} characters',
            'string.max': 'Last name should not exceed {#limit} characters',
            'any.required': 'Last name is required'
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'string.empty': 'Email cannot be empty',
            'any.required': 'Email is required'
        }),
    phoneNumber: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .required()
        .messages({
            'string.pattern.base': 'Phone number must be between 10-15 digits',
            'string.empty': 'Phone number cannot be empty',
            'any.required': 'Phone number is required'
        }),
    dateOfBirth: Joi.date()
        .max('now')
        .required()
        .messages({
            'date.base': 'Please provide a valid date',
            'date.max': 'Date of birth cannot be in the future',
            'any.required': 'Date of birth is required'
        }),
    gender: Joi.string()
        .valid('male', 'female')
        .required()
        .messages({
            'any.only': 'Gender must be either male, female or other',
            'any.required': 'Gender is required'
        }),
    classId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required()
        .messages({
            'string.guid': 'Class ID must be a valid UUID',
            'any.required': 'Class ID is required'
        }),
    courseId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required()
        .messages({
            'string.guid': 'Course ID must be a valid UUID',
            'any.required': 'Course ID is required'
        }),
        
    // Optional fields
    profilePhoto: Joi.string().uri().optional(),
    country: Joi.string().optional(),
    city: Joi.string().optional(),
    province: Joi.string().optional(),
    district: Joi.string().optional(),
    sector: Joi.string().optional(),
    village: Joi.string().optional(),
    road: Joi.string().optional(),
    postalCode: Joi.string().optional(),
    addressLine1: Joi.string().optional(),
    addressLine2: Joi.string().optional()
});

const validateStudentRegistration = (req, res, next) => {
    const { error } = studentRegistrationSchema.validate(req.body, { 
        abortEarly: false,
        allowUnknown: true  // Allows other non-specified fields in the request
    });
    
    if (error) {
        const errorMessages = error.details.map(detail => detail.message);
        return res.status(400).json({ 
            success: false,
            message: 'Validation failed',
            errors: errorMessages 
        });
    }
    next();
};

export default validateStudentRegistration;
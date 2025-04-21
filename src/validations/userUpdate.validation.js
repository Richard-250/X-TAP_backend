import Joi from "joi";

const userUpdateSchema = Joi.object({
    firstName: Joi.string().trim().min(2).max(50),
    lastName: Joi.string().trim().min(2).max(50),
    email: Joi.string().email().lowercase().trim(),
    phoneNumber: Joi.string().pattern(/^\+?[0-9]{10,15}$/).messages({
        'string.pattern.base': 'Phone number must be between 10-15 digits'
    }),
    dateOfBirth: Joi.date()
        .max('now')
        .messages({
            'date.base': 'Date of birth must be a valid date',
            'date.format': 'Date of birth must be in YYYY-MM-DD format',
            'date.max': 'Date of birth cannot be in the future',
        }),
    profilePhoto: Joi.string().uri().allow(null, ''),
    role: Joi.string().valid('admin', 'manager', 'staff', 'accountant', 'mentor'),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').allow(null),
    bio: Joi.string().max(1000).allow(null, ''),
    isEnabled: Joi.boolean(),
    isPublic: Joi.boolean(),
    // Address fields
    country: Joi.string().max(100).allow(null, ''),
    city: Joi.string().max(100).allow(null, ''),
    province: Joi.string().max(100).allow(null, ''),
    district: Joi.string().max(100).allow(null, ''),
    sector: Joi.string().max(100).allow(null, ''),
    village: Joi.string().max(100).allow(null, ''),
    road: Joi.string().max(100).allow(null, ''),
    postalCode: Joi.string().max(20).allow(null, ''),
    addressLine1: Joi.string().max(255).allow(null, ''),
    addressLine2: Joi.string().max(255).allow(null, ''),
    // New fields
    disabledAt: Joi.date().allow(null),
    isFirstLogin: Joi.boolean()
}).min(1); // At least one field must be provided for update

const validateUserUpdate = (req, res, next) => {
    const { error } = userUpdateSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
};

export default validateUserUpdate;
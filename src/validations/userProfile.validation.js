import Joi from "joi";

const signUpSchema = Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email:  Joi.string().email().lowercase().trim().required(),
    phoneNumber: Joi.string().pattern(/^\+?[0-9]{10}$/).message({
        'string.pattern.base': 'Phone number must be between 10 digits'
      }),   
      dateOfBirth: Joi.date()
      .max('now').required()
      .messages({
        'date.base': 'Date of birth must be a valid date',
        'date.format': 'Date of birth must be in YYYY-MM-DD format',
        'date.max': 'Date of birth cannot be in the future',
        'any.required': 'Date of birth is required'
      }),
  profilePhoto: Joi.string().uri().allow(null, ''),
  role: Joi.string().valid('admin', 'manager', 'staff', 'accountant', 'mentor').default('mentor'),   
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').allow(null),
  bio: Joi.string().max(1000).allow(null, ''),
  isEnabled: Joi.boolean().default(true),
  isPublic: Joi.boolean().default(true),
 
  country: Joi.string().max(100).allow(null, ''),
  title: Joi.string().max(100).required(),
  city: Joi.string().max(100).allow(null, ''),
  province: Joi.string().max(100).allow(null, ''),
  district: Joi.string().max(100).allow(null, ''),
  sector: Joi.string().max(100).allow(null, ''),
  village: Joi.string().max(100).allow(null, ''),
  road: Joi.string().max(100).allow(null, ''),
  postalCode: Joi.string().max(20).allow(null, ''),
  addressLine1: Joi.string().max(255).allow(null, ''),
  addressLine2: Joi.string().max(255).allow(null, '')
});

const validateUserProfile = (req, res, next) => {
    const { error } = signUpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  };

  export default validateUserProfile
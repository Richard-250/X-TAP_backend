import Joi from 'joi';


const nameRegex = /^[a-zA-Z\s]+$/;


const cleanMessage = (msg) => msg.replace(/[^a-zA-Z0-9 .]/g, '');


export const createManagerSchema = Joi.object({
  firstName: Joi.string()
    .pattern(nameRegex)
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.base': 'First name must be a string',
      'string.empty': 'First name is required',
      'string.pattern.base': 'First name must contain only letters and spaces',
    }),

  lastName: Joi.string()
    .pattern(nameRegex)
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.base': 'Last name must be a string',
      'string.empty': 'Last name is required',
      'string.pattern.base': 'Last name must contain only letters and spaces',
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email must be valid',
      'string.empty': 'Email is required',
    }),

  gender: Joi.string()
    .valid('male', 'female')
    .required()
    .messages({
      'any.only': 'Gender must be either male or female',
      'string.empty': 'Gender is required',
    }),

  title: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Title is required',
    }),

  phoneNumber: Joi.string()
    .pattern(/^\d{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be exactly 10 digits',
      'string.empty': 'Phone number is required',
    }),
});


export const validateCreateManager = (req, res, next) => {
  const { error } = createManagerSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map(detail => cleanMessage(detail.message));
    return res.status(400).json({ errors: messages });
  }

  next();
};

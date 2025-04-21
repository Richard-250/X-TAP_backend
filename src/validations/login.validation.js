import Joi from "joi";

const loginSchema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string()
    .pattern(/^WM\d{4}$/) 
    .required()
    .messages({
      'string.pattern.base': 'Password must be in the format "WM" followed by 4 digits (e.g., WM1234)',
      'any.required': 'Password is required'
    })
    
  });

 const validateLogin = (req, res, next) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  };


  export default validateLogin
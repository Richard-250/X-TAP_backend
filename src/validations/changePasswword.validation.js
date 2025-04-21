import Joi from "joi";

const password = Joi.object({
      currentPassword: Joi.string()
        .pattern(/^WM\d{4}$/)
        .message({
          'string.pattern.base': 'Password must start with "WM" followed by exactly four digits (e.g., WM1234).'
        }).required(),
        newPassword: Joi.string()
        .pattern(/^\d{4}$/)
        .message({
          'string.pattern.base': 'Password must be exactly 4 digits (e.g., 1234)',
          'string.empty': 'Password cannot be empty',
          'any.required': 'Password is required'
        })
        .required()
    
  });

 const validateChangePassword = (req, res, next) => {
    const { error } = password.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  };


  export default validateChangePassword
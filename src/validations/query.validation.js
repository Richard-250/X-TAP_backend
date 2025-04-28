import Joi from "joi";

const searchQuerySchema = Joi.object({
  classId: Joi.string()
    .guid({
      version: ['uuidv4', 'uuidv5']
    })
    .messages({
      'string.guid': 'Class ID must be a valid UUID'
    }),
    
  status: Joi.string()
    .valid('present', 'absent', 'late', 'excused')
    .insensitive()
    .messages({
      'any.only': 'Status must be one of: present, absent, late, excused'
    }),
    
  date: Joi.date()
    .iso()
    .messages({
      'date.iso': 'Date must be in valid ISO 8601 format (YYYY-MM-DD)'
    }),
    
  startDate: Joi.date()
    .iso()
    .messages({
      'date.iso': 'Start date must be in valid ISO 8601 format (YYYY-MM-DD)'
    })
    .when('endDate', {
      is: Joi.exist(),
      then: Joi.date().less(Joi.ref('endDate')).messages({
        'date.less': 'Start date must be before end date'
      })
    }),
    
  endDate: Joi.date()
    .iso()
    .messages({
      'date.iso': 'End date must be in valid ISO 8601 format (YYYY-MM-DD)'
    }),
    
  studentName: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .messages({
      'string.min': 'Student name must be at least 1 character',
      'string.max': 'Student name cannot exceed 50 characters'
    }),
    
  sortBy: Joi.string()
    .valid('date', 'studentName', 'status', 'className')
    .default('date')
    .messages({
      'any.only': 'Invalid sort field'
    }),
    
  sortOrder: Joi.string()
    .valid('ASC', 'DESC')
    .default('DESC')
    .insensitive()
    .messages({
      'any.only': 'Sort order must be ASC or DESC'
    }),
    
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be a positive integer'
    }),
    
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
})
.options({ 
  allowUnknown: false, 
  abortEarly: false,
  stripUnknown: true
});

const validateSearchQuery = (req, res, next) => {
  const { error, value } = searchQuerySchema.validate(req.query, {
    convert: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join('; ');
    return res.status(400).json({ 
      success: false,
      message: `Validation error: ${errorMessage}` 
    });
  }

  req.query = value;
  next();
};

export default validateSearchQuery;
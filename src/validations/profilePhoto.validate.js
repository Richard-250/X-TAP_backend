import Joi from "joi";

// Supported image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const profilePhotoSchema = Joi.object({
  photo: Joi.object({
    fieldname: Joi.string().valid('photo').required().messages({
      'any.only': 'Fieldname must be "photo"',
      'any.required': 'File is required'
    }),
    originalname: Joi.string().required().messages({
      'any.required': 'Filename is required'
    }),
    mimetype: Joi.string()
      .valid(...ALLOWED_MIME_TYPES)
      .required()
      .messages({
        'any.only': `Only ${ALLOWED_MIME_TYPES.join(', ')} formats are allowed`,
        'any.required': 'File type is required'
      }),
    size: Joi.number()
      .max(5 * 1024 * 1024) // 5MB max
      .required()
      .messages({
        'number.max': 'File size must be less than 5MB',
        'any.required': 'File size is required'
      }),
    buffer: Joi.binary().required().messages({
      'any.required': 'File data is required'
    }),
  }).unknown(true), // Allow other fields like encoding
}).unknown(false); // Allow other fields in the request

const validateProfilePhoto = (req, res, next) => {
  // For multipart/form-data, we validate req.file (single) or req.files (multiple)
  const fileToValidate = req.file || (req.files && req.files.photo);
  
  const { error } = profilePhotoSchema.validate(
    { photo: fileToValidate },
    { abortEarly: false }
  );

  if (error) {
    const errors = error.details.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    return res.status(400).json({ errors });
  }
  next();
};

export default validateProfilePhoto;
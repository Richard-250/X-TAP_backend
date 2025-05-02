import multer from 'multer';
import { createStorage } from '../../config/cloudinary.config.js';

const IMAGE_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff'
};

const imageFileFilter = (req, file, cb) => {
  if (IMAGE_MIME_TYPES[file.mimetype]) {
    return cb(null, true);
  }
  return cb({
    message: 'Only image files are allowed (jpg, png, gif, webp, svg, bmp, tiff)',
    code: 'UNSUPPORTED_FILE_TYPE',
    statusCode: 400
  }, false);
};

export const createImageUploader = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024,
    folder = process.env.CLOUDINARY_IMAGE_FOLDER || 'images',
    fieldName = 'image',
    maxCount = 10,
    transformation = {},
    format = undefined,
  } = options;

  const storage = createStorage({
    folder,
    resourceType: 'image',
    transformation,
    format,
    filenameGenerator: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = file.originalname.split('.')[0];
      return `${filename}-${uniqueSuffix}`;
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter: imageFileFilter
  });

  return {
    single: () => upload.single(fieldName),
    array: (count = maxCount) => upload.array(fieldName, count),
    fields: (fields) => upload.fields(fields),
    handler: (method, ...args) => {
      return (req, res, next) => {
        let uploadMiddleware;

        if (method === 'single') {
          uploadMiddleware = upload.single(fieldName);
        } else if (method === 'array') {
          const count = args.length > 0 ? args[0] : maxCount;
          uploadMiddleware = upload.array(fieldName, count);
        } else if (method === 'fields') {
          uploadMiddleware = upload.fields(args[0] || []);
        } else {
          uploadMiddleware = upload.none();
        }

        uploadMiddleware(req, res, (err) => {
          if (err) {
            if (err instanceof multer.MulterError) {
              return res.status(400).json({
                success: false,
                error: {
                  message: `Upload error: ${err.message}`,
                  code: err.code,
                  field: err.field
                }
              });
            }
          }
          next();
        });
      };
    }
  };
};

const imageUploader = createImageUploader();

export default imageUploader;
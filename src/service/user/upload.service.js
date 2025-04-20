import multer from 'multer';
import defaultStorage, { createStorage } from '../../config/cloudinary.config.js';

// Common MIME types grouped by category
const MIME_TYPES = {
  IMAGE: {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff'
  },
  VIDEO: {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/ogg': 'ogv',
    'video/quicktime': 'mov'
  },
  DOCUMENT: {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
  },
  AUDIO: {
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'weba'
  }
};


const createFileFilter = (allowedTypes, maxSize = 5 * 1024 * 1024) => {
  return (req, file, cb) => {
    // Check file size through Multer's limits option
    
    // Validate file type
    if (Array.isArray(allowedTypes)) {
      // If allowedTypes is an array of MIME types
      if (allowedTypes.includes(file.mimetype)) {
        return cb(null, true);
      }
    } else if (typeof allowedTypes === 'object') {
      // If allowedTypes is an object with MIME type categories
      for (const category in allowedTypes) {
        if (allowedTypes[category][file.mimetype]) {
          return cb(null, true);
        }
      }
    }
    
    // Invalid file type
    return cb({
      message: 'Unsupported file format',
      code: 'UNSUPPORTED_FILE_TYPE',
      statusCode: 400
    }, false);
  };
};

export const createUploader = (options = {}) => {
  const {
    fileTypes = 'IMAGE',
    maxSize = 5 * 1024 * 1024, // Default 5MB
    folder = 'uploads',
    fieldName = 'file',
    maxCount = 10,
    transformation = {},
    format = undefined,
  } = options;

  // Determine allowed MIME types
  let allowedTypes;
  if (typeof fileTypes === 'string') {
    // Use predefined MIME type group
    allowedTypes = MIME_TYPES[fileTypes] ? { [fileTypes]: MIME_TYPES[fileTypes] } : MIME_TYPES.IMAGE;
  } else if (Array.isArray(fileTypes)) {
    // Custom array of MIME types
    allowedTypes = fileTypes;
  } else {
    // Default to images
    allowedTypes = { IMAGE: MIME_TYPES.IMAGE };
  }

  // Set resource type for Cloudinary
  let resourceType = 'auto';
  if (fileTypes === 'IMAGE') resourceType = 'image';
  if (fileTypes === 'VIDEO') resourceType = 'video';
  if (fileTypes === 'AUDIO') resourceType = 'video'; // Cloudinary handles audio as video
  if (fileTypes === 'DOCUMENT') resourceType = 'raw';

  // Create storage with specified options
  const storage = createStorage({
    folder, 
    resourceType,
    transformation,
    format,
    // Custom filename generator to preserve original name and add timestamp
    filenameGenerator: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = file.originalname.split('.')[0];
      // Return filename without extension - Cloudinary adds the appropriate extension
      return `${filename}-${uniqueSuffix}`;
    }
  });

  // Create multer instance
  const upload = multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter: createFileFilter(allowedTypes, maxSize)
  });

  // Return object with various upload methods
  return {
    // Single file upload
    single: () => upload.single(fieldName),
    
    // Multiple files with the same field name
    array: (count = maxCount) => upload.array(fieldName, count),
    
    // Multiple files with different field names
    fields: (fields) => upload.fields(fields),
    
    // Handle request but don't process files
    none: () => upload.none(),
    
    // Custom middleware that wraps the upload to handle errors
    customHandler: (method, ...args) => {
      return (req, res, next) => {
        upload[method](...args)(req, res, (err) => {
          if (err) {
            if (err instanceof multer.MulterError) {
              // A Multer error occurred when uploading
              return res.status(400).json({
                success: false,
                error: {
                  message: `Upload error: ${err.message}`,
                  code: err.code,
                  field: err.field
                }
              });
            } else if (err) {
              // An unknown error occurred when uploading
              return res.status(err.statusCode || 500).json({
                success: false,
                error: {
                  message: err.message || 'Unknown upload error',
                  code: err.code || 'UNKNOWN_ERROR'
                }
              });
            }
          }
          // No errors, continue to next middleware
          next();
        });
      };
    }
  };
};

// Create standard uploaders for common file types
export const imageUploader = createUploader({ 
  fileTypes: 'IMAGE',
  folder: process.env.CLOUDINARY_IMAGE_FOLDER || 'images'
});

export const videoUploader = createUploader({ 
  fileTypes: 'VIDEO',
  folder: process.env.CLOUDINARY_VIDEO_FOLDER || 'videos',
  maxSize: 100 * 1024 * 1024 // 100MB for videos
});

export const documentUploader = createUploader({ 
  fileTypes: 'DOCUMENT',
  folder: process.env.CLOUDINARY_DOCUMENT_FOLDER || 'documents'
});

export const audioUploader = createUploader({ 
  fileTypes: 'AUDIO',
  folder: process.env.CLOUDINARY_AUDIO_FOLDER || 'audio'
});

// Default uploader (images)
const defaultUploader = imageUploader;
export default defaultUploader;
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import 'dotenv/config';

// Ensure required environment variables are set
const requiredEnvVars = ['CLOUD_NAME', 'CLOUD_API_KEY', 'CLOUD_API_KEY_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_KEY_SECRET,
  secure: false, 
});

export const createStorage = (options = {}) => {
  const {
    folder = 'uploads',
    resourceType = 'auto',
    filenameGenerator = undefined,
    transformation = {},
    format = undefined,
    allowedFormats = undefined,
  } = options;

  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      resource_type: resourceType,
      format,
      allowed_formats: allowedFormats,
      transformation,
      ...(filenameGenerator && { filename: filenameGenerator }),
    },
  });
};

// Default storage with standard configuration
const defaultStorage = createStorage({
  folder: process.env.CLOUDINARY_FOLDER || 'NFC student management',
});

// Utility function to get cloudinary instance for direct operations
export const getCloudinary = () => cloudinary;

export default defaultStorage;
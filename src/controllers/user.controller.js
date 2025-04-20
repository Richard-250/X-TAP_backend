import { getCloudinary } from '../config/cloudinary.config.js';
import { createUploader } from '../service/user/upload.service.js';
import db from '../database/models/index.js';
const { User } = db;
import * as userService from '../service/index.service.js';

export const createManager = async (req, res) => {
  try {
    const adminId = req.user.id;
    const userData = req.body;
    
    // Check for existing user
    const existingUser = await userService.findUserByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({ 
        success: 'false',
        message: 'Email is already registered',
        suggestion: 'Please use a different email address or reset password if this is your account'
      });
    }
    
    // Create manager with role set to 'manager'
    const newManager = await userService.createUser(
      { ...userData, role: 'manager' }, 
      adminId
    );
    
    // Prepare response (excluding sensitive fields)
    const { password, verificationToken, verificationExpires, ...managerResponse } = newManager.toJSON();
    
    res.status(201).json({
      success: true,
      message: 'Manager account created successfully. Verification email sent.',
      manager: managerResponse
    });
  } catch (error) {
    console.error('Manager creation error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create manager account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const userData = req.body;
    
    if (!userData.firstName || !userData.lastName || !userData.email || !userData.role) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: firstName, lastName, email, role'
      });
    }
    
    const existingUser = await userService.findUserByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'Email is already registered',
        suggestion: 'Please use a different email address or reset password if this is your account'
      });
    }
    
    const newUser = await userService.createUser(userData, requesterId);
    
    const { password, verificationToken, verificationExpires, ...userResponse } = newUser.toJSON();
    
    res.status(201).json({
      success: true,
      message: `${userData.role} account created successfully. Verification email sent.`,
      user: userResponse
    });
  } catch (error) {
    console.error('User creation error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create user account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getAllUsers = async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Only admin users can access all user data'
        });
      }
      
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const filters = { ...req.query };
      delete filters.page;
      
      const result = await userService.getAllUsers(filters, page, limit);
      
      res.status(200).json({
        success: true,
        message: 'Filtered users retrieved successfully',
        data: result.users,
        pagination: result.pagination,
        filters
      });
    } catch (error) {
      console.error('Error fetching filtered users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  };
  
  export const getUserByManager = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const filters = { ...req.query };
      delete filters.page;
      
      const result = await userService.getNonAdminUsers(filters, page, limit);
      
      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully (excluding admins and managers)',
        data: result.users,
        pagination: result.pagination,
        filters,
        restrictions: {
          alwaysExcludedRoles: ['admin', 'manager'],
          onlyVerifiedUsers: true
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  };
  
  export const getMyProfile = async (req, res) => {
    try {
      const userId = req.user.id;
      
      const user = await userService.findUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const { password, verificationToken, verificationExpires, ...userResponse } = user.toJSON();
      
      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  };
  
  export const updateMyProfile = async (req, res) => {
    try {
      const userId = req.user.id;
      const updateData = { ...req.body };
      
      // Remove fields that shouldn't be updated
      delete updateData.password;
      delete updateData.role;
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.updatedAt;
      delete updateData.isVerified;
      delete updateData.verificationToken;
      delete updateData.verificationExpires;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields provided for update'
        });
      }
      
      const updatedUser = await userService.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found or no changes made'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'User profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update user profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  };
  
  export const updateUserRole = async (req, res) => {
    try {
      const { userId, newRole } = req.body;
      
      if (!userId || !newRole) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: userId and newRole'
        });
      }
      
      if (['admin', 'manager'].includes(newRole)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Managers cannot assign admin or manager roles'
        });
      }
      
      const result = await userService.updateUserRole(userId, newRole);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'User not found or not authorized to modify this user'
        });
      }
      
      console.log(`Manager ${req.user.id} changed user ${userId} role from ${result.roleChange.previousRole} to ${newRole}`);
      
      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        user: result.user,
        roleChange: result.roleChange
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to update user role',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  };

// Create a specialized uploader for profile images with specific settings
const profileImageUploader = createUploader({
  fileTypes: 'IMAGE', // Only allow image files
  folder: process.env.CLOUDINARY_PROFILE_IMAGES_FOLDER || 'profile-images',
  maxSize: 2 * 1024 * 1024, // Limit to 2MB for profile images
  fieldName: 'profileImage', // Specific field name for profile images
  maxCount: 1, // Only one profile image per request
  transformation: {
    width: 400, // Resize to standard size
    height: 400,
    crop: 'fill', // Crop to fill the dimensions
    gravity: 'face', // Focus on face if present
    quality: 'auto:good' // Optimize quality
  }
});

/**
 * Generate avatar URL based on user's first name
 * @param {String} firstName - User's first name
 * @returns {String} - URL for the generated avatar
 */
const generateDefaultAvatar = (firstName) => {
  // Default to first letter of firstName in uppercase
  const letter = firstName ? firstName.charAt(0).toUpperCase() : 'U';
  
  // You can use a service like DiceBear Avatars, UI Avatars, or a custom solution
  // Here we're using UI Avatars as an example
  return `https://ui-avatars.com/api/?name=${letter}&background=random&size=400&font-size=0.5`;
};

// Controller for handling profile image operations
const profileImageController = {
  /**
   * Upload a new profile image
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  uploadProfileImage: async (req, res) => {
    try {
      // The image should be available in req.file after multer middleware processes it
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No profile image uploaded'
        });
      }

      // Get user ID from authenticated user in request
      const userId = req.user.id;
      
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Update user's profilePhoto field with new image URL
      user.profilePhoto = req.file.path;
      // Store the publicId for future reference (optional, depends on your User model)
      if (!user.metadata) user.metadata = {};
      user.metadata.profilePhotoPublicId = req.file.filename;
      
      // Save the updated user
      await user.save();

      // Return success with the uploaded file details
      return res.status(200).json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          profileImage: req.file.path, // Cloudinary URL
          publicId: req.file.filename, // Cloudinary public ID
          format: req.file.format,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('Profile image upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload profile image',
        error: error.message
      });
    }
  },

  /**
   * Update an existing profile image (delete old one and upload new one)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateProfileImage: async (req, res) => {
    try {
      // The new image should be available in req.file after multer middleware processes it
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No profile image uploaded'
        });
      }

      // Get user ID from authenticated user in request
      const userId = req.user.id;
      
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete the old profile image if we have a publicId
      let oldPublicId = req.body.oldPublicId;
      
      // If no oldPublicId was provided in the request, try to get it from user metadata
      if (!oldPublicId && user.metadata && user.metadata.profilePhotoPublicId) {
        oldPublicId = user.metadata.profilePhotoPublicId;
      }
      
      if (oldPublicId) {
        const cloudinary = getCloudinary();
        await cloudinary.uploader.destroy(oldPublicId);
      }
      
      // Update user's profilePhoto field with new image URL
      user.profilePhoto = req.file.path;
      // Store the new publicId for future reference
      if (!user.metadata) user.metadata = {};
      user.metadata.profilePhotoPublicId = req.file.filename;
      
      // Save the updated user
      await user.save();

      // Return success with the uploaded file details
      return res.status(200).json({
        success: true,
        message: 'Profile image updated successfully',
        data: {
          profileImage: req.file.path, // Cloudinary URL
          publicId: req.file.filename, // Cloudinary public ID
          format: req.file.format,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('Profile image update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile image',
        error: error.message
      });
    }
  },

  /**
   * Delete a profile image
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteProfileImage: async (req, res) => {
    try {
      // Get user ID from authenticated user in request
      const userId = req.user.id;
      
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get the publicId from params or from user metadata
      let publicId = req.params.publicId;
      if (!publicId && user.metadata && user.metadata.profilePhotoPublicId) {
        publicId = user.metadata.profilePhotoPublicId;
      }
      
      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'Public ID is required to delete a profile image'
        });
      }

      // Delete the image from Cloudinary
      const cloudinary = getCloudinary();
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok') {
        // Generate default avatar URL based on user's first name
        const defaultAvatar = generateDefaultAvatar(user.firstName);
        
        // Update user's profilePhoto to default avatar
        user.profilePhoto = defaultAvatar;
        // Remove publicId from metadata
        if (user.metadata) {
          delete user.metadata.profilePhotoPublicId;
        }
        
        // Save the updated user
        await user.save();

        return res.status(200).json({
          success: true,
          message: 'Profile image deleted successfully',
          data: {
            profileImage: defaultAvatar
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete profile image',
          data: result
        });
      }
    } catch (error) {
      console.error('Profile image deletion error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete profile image',
        error: error.message
      });
    }
  }
};

// Export the uploader middleware and controller
export const profileImageMiddleware = profileImageUploader;
export default profileImageController;
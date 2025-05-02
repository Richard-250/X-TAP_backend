import { imageUploader } from '../service/user/upload.service.js';
import profilePhotoService from '../service/user/profilePhoto.service.js';
import * as userService from '../service/user/user.service.js';

export const createManager = async (req, res) => {
  try {
    const adminId = req.user.id;
    const userData = req.body;
    
    const existingUser = await userService.findUserByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'Email is already registered',
        suggestion: 'Please use a different email address or reset password if this is your account'
      });
    }
    
    const newManager = await userService.createUser(
      { ...userData, role: 'manager' }, 
      adminId
    );
    
    const { password, verificationToken, verificationExpires, ...managerResponse } = newManager;
    
    res.status(201).json({
      success: true,
      message: 'Manager account created successfully. Verification email sent.',
      manager: managerResponse
    });
  } catch (error) {
    console.error('Manager creation error:', error);
    
    if (error.name === 'PrismaClientValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.message
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
  
    
    const existingUser = await userService.findUserByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'Email is already registered',
        suggestion: 'Please use a different email address or reset password if this is your account'
      });
    }
    
    const newUser = await userService.createUser(userData, requesterId);
    
    const { password, verificationToken, verificationExpires, ...userResponse } = newUser;
    
    res.status(201).json({
      success: true,
      message: `${userData.role} account created successfully. Verification email sent.`,
      user: userResponse
    });
    
  } catch (error) {
    console.error('User creation error:', error);
    
    if (error.name === 'PrismaClientValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.message
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

    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;

    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page parameter. Page must be greater than 0.'
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit parameter. Limit must be between 1 and 100.'
      });
    }

    const filters = Object.fromEntries(
      Object.entries(req.query).filter(([key]) => !['page', 'limit'].includes(key))
    );

    const dateParams = Object.keys(filters).filter(key =>
      key.includes('[gte]') || key.includes('[lte]')
    );

    for (const param of dateParams) {
      const dateValue = filters[param];
      if (dateValue && Number.isNaN(Date.parse(dateValue))) {
        return res.status(400).json({
          success: false,
          message: `Invalid date format for parameter: ${param}`
        });
      }
    }

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
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;

    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page parameter. Page must be greater than 0.'
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit parameter. Limit must be between 1 and 100.'
      });
    }

    const filters = Object.fromEntries(
      Object.entries(req.query).filter(([key]) => !['page', 'limit'].includes(key))
    );

    const dateParams = Object.keys(filters).filter(key =>
      key.includes('[gte]') || key.includes('[lte]')
    );

    for (const param of dateParams) {
      const dateValue = filters[param];
      if (dateValue && Number.isNaN(Date.parse(dateValue))) {
        return res.status(400).json({
          success: false,
          message: `Invalid date format for parameter: ${param}`
        });
      }
    }

    const result = await userService.getNonAdminUsers(filters, page, limit);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully (excluding admins and managers)',
      data: result.users,
      pagination: result.pagination,
      filters,
      restrictions: {
        alwaysExcludedRoles: ['admin', 'manager'],
        onlyVerifiedUsers: true,
        onlyEnabledUsers: true
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
    
    const { password, verificationToken, verificationExpires, ...userResponse } = user;
    
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

    const sanitizedData = Object.fromEntries(
      Object.entries(updateData).filter(([key]) => 
        ![
          'password', 
          'role', 
          'id', 
          'createdAt', 
          'updatedAt', 
          'isVerified', 
          'verificationToken', 
          'verificationExpires'
        ].includes(key)
      )
    );

    if (Object.keys(sanitizedData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    const updatedUser = await userService.updateUser(userId, sanitizedData);

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

    if (error.name === 'PrismaClientValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.message
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
    
    return res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: result.user,
      roleChange: result.roleChange
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    
    if (error.name === 'PrismaClientValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const disableUserAccount = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Required field: userId'
      });
    }
    
    // Prevent managers from disabling admin/manager accounts
    const userToDisable = await userService.findUserById(userId);
    if (!userToDisable) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (['admin', 'manager'].includes(userToDisable.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot disable admin or manager accounts'
      });
    }

    if (userToDisable.isEnabled === false) {
      return res.status(200).json({
        success: true,
        message: 'User account is already disabled',
        data: userToDisable,
        status: 'already_disabled'
      });
    }
    
    if (userToDisable.isVerified === false) {
      return res.status(200).json({
        success: true,
        message: 'User account is not verified',
        data: userToDisable,
        status: 'not_verified'
      });
    }
    
    const result = await userService.disableUser(userId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'User not found or not authorized to modify this user'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'User account disabled successfully',
      data: result.user
    });
  } catch (error) {
    console.error('Error disabling user account:', error);
    
    if (error.name === 'PrismaClientValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to disable user account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const profilePhotoController = {
  uploadProfilePhoto: [
    imageUploader.customHandler('single'),
    
    async (req, res) => {
      try {
        const userId = req.user.id;
        const file = req.file;
        
        if (!file) {
          return res.status(400).json({
            success: false,
            message: 'No image file provided'
          });
        }

        // Find the user by ID
        const user = await userService.findUserById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        // Update profile photo using service
        const updatedUser = await profilePhotoService.updateProfilePhoto(user, file);

        return res.status(200).json({
          success: true,
          message: 'Profile photo updated successfully',
          data: {
            profilePhoto: updatedUser.profilePhoto
          }
        });
      } catch (error) {
        console.error('Error in profile photo upload:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update profile photo',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
      }
    }
  ],

  deleteProfilePhoto: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Find the user by ID
      const user = await userService.findUserById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete profile photo and generate avatar using service
      const updatedUser = await profilePhotoService.deleteProfilePhoto(user);

      return res.status(200).json({
        success: true,
        message: 'Profile photo replaced with avatar',
        data: {
          profilePhoto: updatedUser.profilePhoto
        }
      });
    } catch (error) {
      console.error('Error handling profile photo deletion:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process profile photo',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};
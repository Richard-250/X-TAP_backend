import db from '../../database/models/index.js';
import { Op } from "sequelize";
import { Sequelize } from 'sequelize';
import { generateRandomToken, generatePassword, hashPassword, verifyPassword } from "../../utils/password.js";
import { sendVerificationEmail, sendPasswordEmail } from "./email.service.js";

const { User } = db;

export const findUserByEmail = async (email) => {
  return await User.findOne({ where: { email } });
};

export const findUserById = async (id) => {
  return await User.findByPk(id);
};

export const disableUser = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return null;
    }

    // Don't disable already disabled accounts
    if (user.isEnabled === false) {
      return { user };
    }
    if (user.isVerified === false) {
      return { user };
    }

    const updatedUser = await user.update({
      isEnabled: false,
      disabledAt: new Date() 
    });

    return {
      user: updatedUser,
    };
  } catch (error) {
    throw error;
  }
}

export const findUserByVerificationToken = async (token) => {
  return await User.findOne({
    where: {
      verificationToken: token,
      verificationExpires: { [Op.gt]: new Date() }
    }
  });
};

export const findUserByResetToken = async (token, email) => {
  return await User.findOne({
    where: {
      email,
      passwordResetToken: token,
      passwordResetExpires: { [Op.gt]: new Date() }
    }
  });
};

export const createUser = async (userData, createdById) => {

  const verificationToken = generateRandomToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const newUserData = {
    ...userData,
    verificationToken,
    verificationExpires,
    createdBy: createdById,
    isVerified: false,
    isEnabled: true,
    isPublic: true,
    profilePhoto: generateProfileAvatar(userData.firstName, userData.lastName, userData.gender)
  };
  
  // Create user
  const newUser = await User.create(newUserData);
  
  // Send verification email
  await sendVerificationEmail(newUser, verificationToken);
  
  return newUser;
};

export const generateProfileAvatar = (firstName, lastName, gender) => {
  const seed = `${firstName}+${lastName}`;

  switch (gender) {
    case 'female':
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&hair=longHairStraight&accessories=round&facialHair=blank`;
    case 'male':
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&hair=shortHairShortFlat&facialHair=beardMedium&accessories=prescription02`;
    default:
      return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;
  }
};


export const verifyUserAccount = async (user) => {
  // Generate a random password
  const newPassword = generatePassword();
  const hashedPassword = await hashPassword(newPassword);
  
  // Update user
  user.isVerified = true;
  user.password = hashedPassword;
  user.verificationToken = null;
  user.verificationExpires = null;
  await user.save();
  
  // Send password email
  await sendPasswordEmail(user, newPassword);
  
  return { user, newPassword };
};

export const updateUserPassword = async (user, newPassword) => {
  const hashedPassword = await hashPassword(newPassword);
  
  // Update password
  user.password = hashedPassword;
  await user.save();
  
  return user;
};

export const generatePasswordResetToken = async (user) => {
  const resetToken = generateRandomToken();
  const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  
  await user.update({
    passwordResetToken: resetToken,
    passwordResetExpires: resetTokenExpires
  });
  
  return { user, resetToken };
};

export const resetUserPassword = async (user) => {
  const newPassword = generatePassword();
  const hashedPassword = await hashPassword(newPassword);
  
  await user.update({
    password: hashedPassword,
    passwordResetToken: null,
    passwordResetExpires: null,
    passwordChangedAt: new Date()
  });
  
  await sendPasswordEmail(user, newPassword);
  
  return { user, newPassword };
};

export const regenerateVerificationToken = async (user) => {
  const verificationToken = generateRandomToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  user.verificationToken = verificationToken;
  user.verificationExpires = verificationExpires;
  await user.save();
  
  await sendVerificationEmail(user, verificationToken);
  
  return { user, verificationToken, verificationExpires };
};

export const getAllUsers = async (filters = {}, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const whereClause = {};
  let order = [['createdAt', 'DESC']]; // Default sorting
  
  // Handle search across multiple fields
  if (filters.search) {
    whereClause[Sequelize.Op.or] = [
      { firstName: { [Sequelize.Op.iLike]: `%${filters.search}%` } },
      { lastName: { [Sequelize.Op.iLike]: `%${filters.search}%` } },
      { email: { [Sequelize.Op.iLike]: `%${filters.search}%` } },
      { bio: { [Sequelize.Op.iLike]: `%${filters.search}%` } },
      { phoneNumber: { [Sequelize.Op.iLike]: `%${filters.search}%` } }
    ];
    delete filters.search;
  }
  
  // Handle sorting
  if (filters.sort) {
    const sortParams = filters.sort.split(',');
    order = sortParams.map(param => {
      const [field, direction] = param.split(':');
      return [field, (direction || 'ASC').toUpperCase()];
    });
    delete filters.sort;
  }
  
  // Handle date range filters with operators
  const dateFields = ['createdAt', 'lastLogin', 'disabledAt', 'verificationExpires', 'passwordResetExpires'];
  dateFields.forEach(field => {
    // Greater than or equal
    if (filters[`${field}[gte]`]) {
      whereClause[field] = {
        ...whereClause[field],
        [Sequelize.Op.gte]: new Date(filters[`${field}[gte]`])
      };
      delete filters[`${field}[gte]`];
    }
    // Less than or equal
    if (filters[`${field}[lte]`]) {
      whereClause[field] = {
        ...whereClause[field],
        [Sequelize.Op.lte]: new Date(filters[`${field}[lte]`])
      };
      delete filters[`${field}[lte]`];
    }
  });
  
  // Handle array parameters (like multiple roles)
  const arrayParams = ['role'];
  arrayParams.forEach(param => {
    if (filters[`${param}[]`] && Array.isArray(filters[`${param}[]`])) {
      whereClause[param] = { [Sequelize.Op.in]: filters[`${param}[]`] };
      delete filters[`${param}[]`];
    }
  });
  
  // Handle boolean conversions
  const booleanFields = ['isVerified', 'isEnabled', 'isFirstLogin', 'isPublic'];
  booleanFields.forEach(field => {
    if (filters[field] !== undefined) {
      // Convert string 'true'/'false' to actual boolean
      whereClause[field] = filters[field] === 'true';
      delete filters[field];
    }
  });
  
  // Add remaining filters directly to where clause
  Object.keys(filters).forEach(key => {
    // Skip pagination parameter
    if (key !== 'page' && key !== 'limit') {
      whereClause[key] = filters[key];
    }
  });
  
  // Count total users with these filters
  const totalUsers = await User.count({ where: whereClause });
  const totalPages = Math.ceil(totalUsers / limit);
  
  // Get filtered users
  const users = await User.findAll({
    where: whereClause,
    limit,
    offset,
    attributes: {
      exclude: ['password', 'verificationToken', 'verificationExpires', 'passwordResetToken', 'passwordResetExpires']
    },
    order
  });
  
  // Add virtual fields that aren't automatically included
  const enhancedUsers = users.map(user => {
    const userData = user.toJSON();
    userData.fullName = user.getFullName();
    userData.age = user.age;
    return userData;
  });
  
  return {
    users: enhancedUsers,
    pagination: {
      totalUsers,
      totalPages,
      currentPage: page,
      usersPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

export const getNonAdminUsers = async (filters = {}, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  // Base where clause with default filters (these can't be overridden)
  const whereClause = {
    role: {
      [Sequelize.Op.notIn]: ['admin', 'manager']
    },
    isVerified: true,
    isEnabled: true
  };
  
  let order = [['createdAt', 'DESC']]; // Default sorting
  
  // Handle search across multiple fields
  if (filters.search) {
    whereClause[Sequelize.Op.or] = [
      { firstName: { [Sequelize.Op.iLike]: `%${filters.search}%` } },
      { lastName: { [Sequelize.Op.iLike]: `%${filters.search}%` } },
      { email: { [Sequelize.Op.iLike]: `%${filters.search}%` } },
      { bio: { [Sequelize.Op.iLike]: `%${filters.search}%` } },
      { phoneNumber: { [Sequelize.Op.iLike]: `%${filters.search}%` } }
    ];
    delete filters.search;
  }
  
  // Handle sorting
  if (filters.sort) {
    const sortParams = filters.sort.split(',');
    order = sortParams.map(param => {
      const [field, direction] = param.split(':');
      return [field, (direction || 'ASC').toUpperCase()];
    });
    delete filters.sort;
  }
  
  // Handle date range filters with operators
  const dateFields = ['createdAt', 'lastLogin', 'disabledAt', 'verificationExpires', 'passwordResetExpires'];
  dateFields.forEach(field => {
    // Greater than or equal
    if (filters[`${field}[gte]`]) {
      whereClause[field] = {
        ...whereClause[field],
        [Sequelize.Op.gte]: new Date(filters[`${field}[gte]`])
      };
      delete filters[`${field}[gte]`];
    }
    // Less than or equal
    if (filters[`${field}[lte]`]) {
      whereClause[field] = {
        ...whereClause[field],
        [Sequelize.Op.lte]: new Date(filters[`${field}[lte]`])
      };
      delete filters[`${field}[lte]`];
    }
  });
  
  // Handle array parameters (for multiple values of the same field)
  const arrayParams = ['role'];
  arrayParams.forEach(param => {
    if (filters[`${param}[]`] && Array.isArray(filters[`${param}[]`])) {
      // For role, we need to make sure admin and manager are still excluded
      if (param === 'role') {
        const allowedRoles = filters[`${param}[]`].filter(
          role => !['admin', 'manager'].includes(role)
        );
        if (allowedRoles.length > 0) {
          whereClause[param] = { [Sequelize.Op.in]: allowedRoles };
        }
      } else {
        whereClause[param] = { [Sequelize.Op.in]: filters[`${param}[]`] };
      }
      delete filters[`${param}[]`];
    }
  });
  
  // Handle boolean conversions (skipping isVerified and isEnabled which are fixed)
  const booleanFields = ['isFirstLogin', 'isPublic'];
  booleanFields.forEach(field => {
    if (filters[field] !== undefined) {
      // Convert string 'true'/'false' to actual boolean
      whereClause[field] = filters[field] === 'true';
      delete filters[field];
    }
  });
  
  // Add remaining filters directly to where clause
  Object.keys(filters).forEach(key => {
    // Skip pagination parameters and reserved fields
    if (key !== 'page' && key !== 'limit' && 
        key !== 'isVerified' && key !== 'isEnabled' && 
        key !== 'role') {
      whereClause[key] = filters[key];
    }
  });
  
  try {
    // Get total count and users in parallel for better performance
    const [totalUsers, users] = await Promise.all([
      User.count({ where: whereClause }),
      User.findAll({
        where: whereClause,
        limit,
        offset,
        attributes: {
          exclude: [
            'password',
            'verificationToken',
            'verificationExpires',
            'passwordResetToken',
            'passwordResetExpires'
          ]
        },
        order
      })
    ]);
    
    const totalPages = Math.ceil(totalUsers / limit);
    
    // Add virtual fields that aren't automatically included
    const enhancedUsers = users.map(user => {
      const userData = user.toJSON();
      userData.fullName = user.getFullName();
      userData.age = user.age;
      return userData;
    });
    
    return {
      users: enhancedUsers,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        usersPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error fetching non-admin users:', error);
    throw error; // Re-throw the error for the controller to handle
  }
};

export const updateUser = async (userId, updateData) => {
  // Clean updateData to remove sensitive fields
  const sanitizedData = { ...updateData };
  
  // Remove fields that shouldn't be updated
  delete sanitizedData.password;
  delete sanitizedData.role;
  delete sanitizedData.id;
  delete sanitizedData.createdAt;
  delete sanitizedData.updatedAt;
  delete sanitizedData.isVerified;
  delete sanitizedData.verificationToken;
  delete sanitizedData.verificationExpires;
  
  const [updatedRows] = await User.update(sanitizedData, {
    where: { id: userId },
    returning: true,
    individualHooks: true
  });
  
  if (updatedRows === 0) {
    return null;
  }
  
  // Return updated user
  return await User.findByPk(userId, {
    attributes: {
      exclude: [
        'password',
        'verificationToken',
        'verificationExpires',
        'passwordResetToken',
        'passwordResetExpires',
        'createdBy',
      ]
    }
  });
};

export const updateUserRole = async (userId, newRole) => {
  // Find user first to get current role
  const userToUpdate = await User.findOne({
    where: {
      id: userId,
      role: { [Op.notIn]: ['admin', 'manager'] }
    }
  });
  
  if (!userToUpdate) {
    return null;
  }
  
  const previousRole = userToUpdate.role;
  
  // Update the role
  await User.update(
    { role: newRole },
    { 
      where: { id: userId },
      individualHooks: true
    }
  );
  
  // Get updated user data
  const updatedUser = await User.findByPk(userId, {
    attributes: {
      exclude: [
        'password',
        'verificationToken',
        'verificationExpires',
        'passwordResetToken',
        'passwordResetExpires'
      ]
    }
  });
  
  return {
    user: updatedUser,
    roleChange: {
      previousRole,
      newRole
    }
  };
};

export const validateUserPassword = async (plainPassword, hashedPassword) => {
  return await verifyPassword(plainPassword, hashedPassword);
};
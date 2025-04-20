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
  
  switch(gender) {
    case 'female':
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&hair=longHair,pixie&accessories=roundGlasses,kurt&facialHair=blank`;
    case 'male':
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&hair=shortHair,balding&facialHair=beard,scruff&accessories=prescription02`;
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
  const whereClause = { ...filters };
  
  if (filters.search) {
    whereClause[Sequelize.Op.or] = [
      { firstName: { [Sequelize.Op.iLike]: `%${filters.search}%` } },
      { lastName: { [Sequelize.Op.iLike]: `%${filters.search}%` } },
      { email: { [Sequelize.Op.iLike]: `%${filters.search}%` } }
    ];
    delete whereClause.search;
  }
  
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
    order: [['createdAt', 'DESC']]
  });
  
  return {
    users,
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
  try {
    const offset = (page - 1) * limit;
    
    // Base where clause with default filters
    const whereClause = {
      role: {
        [Op.notIn]: ['admin', 'manager']
      },
      isVerified: true,
      isEnabled: true,  // Only get enabled users
      ...filters
    };
    
    // Handle search filter if present
    if (filters.search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
        { email: { [Op.iLike]: `%${filters.search}%` } }
      ];
      delete whereClause.search;
    }
    
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
        order: [['createdAt', 'DESC']]
      })
    ]);
    
    const totalPages = Math.ceil(totalUsers / limit);
    
    return {
      users,
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
    throw error; // Re-throw the error for the caller to handle
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
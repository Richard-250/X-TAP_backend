import { PrismaClient } from '@prisma/client';
import { generateRandomToken, generatePassword, hashPassword, verifyPassword } from "../../utils/password.js";
import { sendVerificationEmail, sendPasswordEmail } from "./email.service.js";
import { AppError, createError } from "../../utils/error.js";

const prisma = new PrismaClient();

export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({ where: { email } });
};

export const findUserById = async (id) => {
  return await prisma.user.findUnique({ where: { id } });
};

export const disableUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError(404, 'User not found');

  if (!user.isEnabled || !user.isVerified) {
    return { user };
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isEnabled: false,
      disabledAt: new Date()
    }
  });

  return { user: updatedUser };
};

export const findUserByVerificationToken = async (token) => {
  return await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationExpires: { gt: new Date() }
    }
  });
};

export const findUserByResetToken = async (token, email) => {
  return await prisma.user.findFirst({
    where: {
      email,
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() }
    }
  });
};

export const createUser = async (userData, createdById) => {
  const verificationToken = generateRandomToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

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

  
  const newUser = await prisma.user.create({ data: newUserData });
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
  const newPassword = generatePassword();
  const hashedPassword = await hashPassword(newPassword);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      password: hashedPassword,
      verificationToken: null,
      verificationExpires: null
    }
  });

  await sendPasswordEmail(updatedUser, newPassword);

  return { user: updatedUser, newPassword };
};


export const updateUserPassword = async (user, newPassword) => {
  const hashedPassword = await hashPassword(newPassword);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword
    }
  });

  return updatedUser;
};

export const generatePasswordResetToken = async (user) => {
  const resetToken = generateRandomToken();
  const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: resetTokenExpires
    }
  });

  return { user: updatedUser, resetToken };
};

export const resetUserPassword = async (user) => {
  const newPassword = generatePassword();
  const hashedPassword = await hashPassword(newPassword);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      passwordChangedAt: new Date()
    }
  });

  await sendPasswordEmail(updatedUser, newPassword);

  return { user: updatedUser, newPassword };
};

export const regenerateVerificationToken = async (user) => {
  const verificationToken = generateRandomToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken,
      verificationExpires
    }
  });

  await sendVerificationEmail(updatedUser, verificationToken);

  return { user: updatedUser, verificationToken, verificationExpires };
};

export const getAllUsers = async (filters = {}, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const whereClause = {};
  let orderBy = [{ createdAt: 'desc' }];

  const modifiedFilters = { ...filters };

  if (modifiedFilters.search) {
    whereClause.OR = [
      { firstName: { contains: modifiedFilters.search, mode: 'insensitive' } },
      { lastName: { contains: modifiedFilters.search, mode: 'insensitive' } },
      { email: { contains: modifiedFilters.search, mode: 'insensitive' } },
      { bio: { contains: modifiedFilters.search, mode: 'insensitive' } },
      { phoneNumber: { contains: modifiedFilters.search, mode: 'insensitive' } }
    ];
    delete modifiedFilters.search;
  }

  if (modifiedFilters.sort) {
    const sortParams = modifiedFilters.sort.split(',');
    orderBy = sortParams.map(param => {
      const [field, direction] = param.split(':');
      return { [field]: direction?.toUpperCase() === 'DESC' ? 'desc' : 'asc' };
    });
    delete modifiedFilters.sort;
  }

  const dateFields = ['createdAt', 'lastLogin', 'disabledAt', 'verificationExpires', 'passwordResetExpires'];
  for (const field of dateFields) {
    if (modifiedFilters[`${field}[gte]`]) {
      whereClause[field] = { ...whereClause[field], gte: new Date(modifiedFilters[`${field}[gte]`]) };
      delete modifiedFilters[`${field}[gte]`];
    }
    if (modifiedFilters[`${field}[lte]`]) {
      whereClause[field] = { ...whereClause[field], lte: new Date(modifiedFilters[`${field}[lte]`]) };
      delete modifiedFilters[`${field}[lte]`];
    }
  }

  const arrayParams = ['role'];
  for (const param of arrayParams) {
    if (modifiedFilters[`${param}[]`] && Array.isArray(modifiedFilters[`${param}[]`])) {
      whereClause[param] = { in: modifiedFilters[`${param}[]`] };
      delete modifiedFilters[`${param}[]`];
    }
  }

  const booleanFields = ['isVerified', 'isEnabled', 'isFirstLogin', 'isPublic'];
  for (const field of booleanFields) {
    if (modifiedFilters[field] !== undefined) {
      whereClause[field] = modifiedFilters[field] === 'true';
      delete modifiedFilters[field];
    }
  }

  for (const key of Object.keys(modifiedFilters)) {
    if (key !== 'page' && key !== 'limit') {
      whereClause[key] = modifiedFilters[key];
    }
  }

  const [totalUsers, users] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        profilePhoto: true,
        role: true,
        isVerified: true,
        createdBy: true,
        lastLogin: true,
        dateOfBirth: true,
        gender: true,
        isEnabled: true,
        disabledAt: true,
        isFirstLogin: true,
        isPublic: true,
        country: true,
        city: true,
        province: true,
        district: true,
        sector: true,
        village: true,
        road: true,
        postalCode: true,
        addressLine1: true,
        addressLine2: true,
        title: true,
        nfcLoginToken: true,
        nfcLoginTokenExpires: true,
        createdAt: true,
        updatedAt: true,
        bio: true
      },
      orderBy
    })
  ]);

  const totalPages = Math.ceil(totalUsers / limit);

  const enhancedUsers = users.map(user => ({
    ...user,
    fullName: `${user.firstName} ${user.lastName}`,
    age: user.dateOfBirth ? Math.floor((new Date() - new Date(user.dateOfBirth)) / 31557600000) : null
  }));

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

  const whereClause = {
    role: { not: { in: ['admin', 'manager'] } },
    isVerified: true,
    isEnabled: true
  };

  let orderBy = [{ createdAt: 'desc' }];
  const modifiedFilters = { ...filters };

  if (modifiedFilters.search) {
    whereClause.OR = [
      { firstName: { contains: modifiedFilters.search, mode: 'insensitive' } },
      { lastName: { contains: modifiedFilters.search, mode: 'insensitive' } },
      { email: { contains: modifiedFilters.search, mode: 'insensitive' } },
      { bio: { contains: modifiedFilters.search, mode: 'insensitive' } },
      { phoneNumber: { contains: modifiedFilters.search, mode: 'insensitive' } }
    ];
    delete modifiedFilters.search;
  }

  if (modifiedFilters.sort) {
    const sortParams = modifiedFilters.sort.split(',');
    orderBy = sortParams.map(param => {
      const [field, direction] = param.split(':');
      return { [field]: direction?.toUpperCase() === 'DESC' ? 'desc' : 'asc' };
    });
    delete modifiedFilters.sort;
  }

  const dateFields = ['createdAt', 'lastLogin', 'disabledAt', 'verificationExpires', 'passwordResetExpires'];
  for (const field of dateFields) {
    if (modifiedFilters[`${field}[gte]`]) {
      whereClause[field] = { ...whereClause[field], gte: new Date(modifiedFilters[`${field}[gte]`]) };
      delete modifiedFilters[`${field}[gte]`];
    }
    if (modifiedFilters[`${field}[lte]`]) {
      whereClause[field] = { ...whereClause[field], lte: new Date(modifiedFilters[`${field}[lte]`]) };
      delete modifiedFilters[`${field}[lte]`];
    }
  }

  const arrayParams = ['role'];
  for (const param of arrayParams) {
    if (modifiedFilters[`${param}[]`] && Array.isArray(modifiedFilters[`${param}[]`])) {
      const allowedRoles = modifiedFilters[`${param}[]`].filter(
        role => !['admin', 'manager'].includes(role)
      );
      if (allowedRoles.length > 0) {
        whereClause[param] = { in: allowedRoles };
      }
      delete modifiedFilters[`${param}[]`];
    }
  }

  const booleanFields = ['isFirstLogin', 'isPublic'];
  for (const field of booleanFields) {
    if (modifiedFilters[field] !== undefined) {
      whereClause[field] = modifiedFilters[field] === 'true';
      delete modifiedFilters[field];
    }
  }

  for (const key of Object.keys(modifiedFilters)) {
    if (key !== 'page' && key !== 'limit' && key !== 'isVerified' && key !== 'isEnabled' && key !== 'role') {
      whereClause[key] = modifiedFilters[key];
    }
  }

  const [totalUsers, users] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        profilePhoto: true,
        role: true,
        isVerified: true,
        createdBy: true,
        lastLogin: true,
        dateOfBirth: true,
        gender: true,
        isEnabled: true,
        disabledAt: true,
        isFirstLogin: true,
        isPublic: true,
        country: true,
        city: true,
        province: true,
        district: true,
        sector: true,
        village: true,
        road: true,
        postalCode: true,
        addressLine1: true,
        addressLine2: true,
        title: true,
        nfcLoginToken: true,
        nfcLoginTokenExpires: true,
        createdAt: true,
        updatedAt: true,
        bio: true
      },
      orderBy
    })
  ]);

  const totalPages = Math.ceil(totalUsers / limit);

  const enhancedUsers = users.map(user => ({
    ...user,
    fullName: `${user.firstName} ${user.lastName}`,
    age: user.dateOfBirth ? Math.floor((new Date() - new Date(user.dateOfBirth)) / 31557600000) : null
  }));

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

export const updateUser = async (userId, updateData) => {
  const sanitizedData = Object.fromEntries(
    Object.entries(updateData).filter(([key]) => ![
      'password', 'role', 'id', 'createdAt', 'updatedAt', 'isVerified', 'verificationToken', 'verificationExpires'
    ].includes(key))
  );

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: sanitizedData,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      profilePhoto: true,
      role: true,
      isVerified: true,
      lastLogin: true,
      dateOfBirth: true,
      gender: true,
      isEnabled: true,
      disabledAt: true,
      isFirstLogin: true,
      isPublic: true,
      country: true,
      city: true,
      province: true,
      district: true,
      sector: true,
      village: true,
      road: true,
      postalCode: true,
      addressLine1: true,
      addressLine2: true,
      title: true,
      nfcLoginToken: true,
      nfcLoginTokenExpires: true,
      createdAt: true,
      updatedAt: true,
      bio: true
    }
  });

  return updatedUser;
};

export const updateUserRole = async (userId, newRole) => {
  const userToUpdate = await prisma.user.findFirst({
    where: {
      id: userId,
      role: { not: { in: ['admin', 'manager'] } }
    }
  });

  if (!userToUpdate) throw createError(404, 'User not found or not authorized to modify this user');

  const previousRole = userToUpdate.role;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      profilePhoto: true,
      role: true,
      isVerified: true,
      lastLogin: true,
      dateOfBirth: true,
      gender: true,
      isEnabled: true,
      disabledAt: true,
      isFirstLogin: true,
      isPublic: true,
      country: true,
      city: true,
      province: true,
      district: true,
      sector: true,
      village: true,
      road: true,
      postalCode: true,
      addressLine1: true,
      addressLine2: true,
      title: true,
      nfcLoginToken: true,
      nfcLoginTokenExpires: true,
      createdAt: true,
      updatedAt: true,
      bio: true
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
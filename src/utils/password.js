

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const generatePassword = () => {
 
    let password = 'WM';
    
  
    for (let i = 0; i < 4; i++) {
      password += Math.floor(Math.random() * 10);
    }
    
    return password;
  };
  
  export const generateToken = (user) => {
    return jwt.sign(
      { 
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET , 
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '5h', 
  
      }
    );
  };

  export const generateNfcToken = (email, password, expiresIn) => {
    return jwt.sign(
      { 
        email: email,
        password: password
      },
      process.env.JWT_SECRET, 
      {
        expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '5h',
    
      }
    );
  };

export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};


export const verifyToken = (token) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  };

  export const hashToken = (token) => {
    return Crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  };

  
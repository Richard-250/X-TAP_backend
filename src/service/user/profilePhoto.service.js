import { getCloudinary } from "../../config/cloudinary.config.js";


class ProfilePhotoService {

  async updateProfilePhoto(user, file) {
    if (!file) {
      throw new Error('No image file provided');
    }

    // If user already has a profile photo, delete it from Cloudinary
    if (user.profilePhoto) {
      await this.deletePhotoFromCloudinary(user.profilePhoto, user.profilePhotoId);
    }

    // Update user with new profile photo details
    user.profilePhoto = file.path; // Cloudinary URL
    user.profilePhotoId = file.filename; // Store public ID for easier deletion later
    
    await user.save();
    return user;
  }

  async deleteProfilePhoto(user) {
    // If user has a profile photo, delete it from Cloudinary
    if (user.profilePhoto) {
      await this.deletePhotoFromCloudinary(user.profilePhoto, user.profilePhotoId);
      
      // Generate avatar URL using first letter of user's name
      const firstLetter = this.getFirstLetterOfName(user);
      const avatarUrl = this.generateAvatarUrl(firstLetter);
      
      // Replace profile photo with generated avatar
      user.profilePhoto = avatarUrl;
      user.profilePhotoId = undefined; // No public ID for generated avatars
      
      await user.save();
    }

    return user;
  }

  async deletePhotoFromCloudinary(photoUrl, photoId) {
    try {
      const publicId = photoId || this.extractPublicIdFromUrl(photoUrl);
      
      if (publicId) {
        const cloudinary = getCloudinary();
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      console.error('Error deleting photo from Cloudinary:', error);
      // We'll continue even if deletion fails
    }
  }


  extractPublicIdFromUrl(url) {
    if (!url) return null;
    
    try {
      // Extract the filename without extension
      // Example URL: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.jpg
      const urlParts = url.split('/');
      const filenameWithExt = urlParts[urlParts.length - 1];
      const publicIdParts = filenameWithExt.split('.');
      
      // Remove the extension
      publicIdParts.pop();
      
      // Get the folder path if it exists
      const folderIndex = urlParts.indexOf('upload');
      let folderPath = '';
      
      if (folderIndex !== -1 && folderIndex < urlParts.length - 2) {
        folderPath = urlParts.slice(folderIndex + 1, urlParts.length - 1).join('/');
        if (folderPath) folderPath += '/';
      }
      
      return folderPath + publicIdParts.join('.');
    } catch (error) {
      console.error('Error extracting public ID from URL:', error);
      return null;
    }
  }

  getFirstLetterOfName(user) {
    // Try to get first letter from firstName, name, or username
    const name = user.firstName || user.name || user.username || user.email || 'User';
    return name.charAt(0).toUpperCase();
  }

  /**
   * Generate an avatar URL using the first letter
   * @param {string} letter - First letter of name
   * @returns {string} Avatar URL
   */
  generateAvatarUrl(letter) {
    // Generate a UI Avatar URL with the first letter
    // Using a free avatar service 
    const backgroundColor = this.getRandomColor();
    const foregroundColor = '000000'; // Black text
    
    return `https://ui-avatars.com/api/?name=${letter}&background=${backgroundColor}&color=${foregroundColor}&size=256`;
  }

  getRandomColor() {
    // Generate light pastel colors for better visibility of the letter
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.floor(Math.random() * 20); // 70-90%
    const lightness = 70 + Math.floor(Math.random() * 20); // 70-90%
    
    // Convert HSL to Hex
    const h = hue / 360;
    const s = saturation / 100;
    const l = lightness / 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}

export default new ProfilePhotoService();
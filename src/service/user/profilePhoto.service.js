import { getCloudinary } from "../../config/cloudinary.config.js";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ProfilePhotoService {
  async updateProfilePhoto(user, file) {
    if (!file) {
      throw new Error('No image file provided');
    }

    let photoToDelete = null;

    if (user.profilePhoto) {
      photoToDelete = user.profilePhoto;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        profilePhoto: file.path,
      }
    });

    if (photoToDelete) {
      await this.deletePhotoFromCloudinary(photoToDelete);
    }

    return updatedUser;
  }

  async deleteProfilePhoto(user) {
    if (user.profilePhoto) {
      await this.deletePhotoFromCloudinary(user.profilePhoto);

      const firstLetter = this.getFirstLetterOfName(user);
      const avatarUrl = this.generateAvatarUrl(firstLetter);

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          profilePhoto: avatarUrl,
        }
      });

      return updatedUser;
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
    }
  }

  extractPublicIdFromUrl(url) {
    if (!url) return null;

    try {
      const urlParts = url.split('/');
      const filenameWithExt = urlParts[urlParts.length - 1];
      const publicIdParts = filenameWithExt.split('.');

      publicIdParts.pop();

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
    const name = user.firstName || user.name || user.username || user.email || 'User';
    return name.charAt(0).toUpperCase();
  }

  generateAvatarUrl(letter) {
    const backgroundColor = this.getRandomColor();
    const foregroundColor = '000000';

    return `https://ui-avatars.com/api/?name=${letter}&background=${backgroundColor}&color=${foregroundColor}&size=256`;
  }

  getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.floor(Math.random() * 20);
    const lightness = 70 + Math.floor(Math.random() * 20);

    const h = hue / 360;
    const s = saturation / 100;
    const l = lightness / 100;

    let r;
    let g;
    let b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}

export default new ProfilePhotoService();
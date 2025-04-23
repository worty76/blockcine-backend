import cloudinary from "../config/cloudinary";
import fs from "fs";

export const uploadToCloudinary = async (filePath: string): Promise<string> => {
  try {
    // Upload the image
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "images",
      use_filename: true,
      unique_filename: true,
    });

    // Remove file from local uploads
    fs.unlinkSync(filePath);

    return result.secure_url;
  } catch (error) {
    // Remove file from local uploads if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

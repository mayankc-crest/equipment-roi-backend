const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads", "profiles");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, filename);
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error("Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed!"),
      false
    );
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Middleware for single profile image upload
const uploadProfileImage = upload.single("profile_image");

// Utility function to generate file URL
const generateFileUrl = (filename) => {
  if (!filename) return null;
  return `/uploads/profiles/${filename}`;
};

// Utility function to delete old profile image
const deleteProfileImage = (filename) => {
  if (!filename) return;

  try {
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error deleting profile image:", error);
  }
};

// Utility function to extract filename from URL
const extractFilenameFromUrl = (url) => {
  if (!url) return null;
  return path.basename(url);
};

module.exports = {
  uploadProfileImage,
  generateFileUrl,
  deleteProfileImage,
  extractFilenameFromUrl,
  uploadsDir,
};



// import multer from "multer";
// import path from "path";
// import fs from "fs";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadPath = path.join(__dirname, "../../uploads");
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });

// export const upload = multer({ storage });



import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import fileType from "file-type";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter for basic validation
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allowed video extensions
  const allowedExtensions = [".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(
      new Error(
        `Invalid file type. Allowed: ${allowedExtensions.join(", ")}`
      )
    );
  }

  // Basic MIME type check (will be verified with magic number later)
  const allowedMimeTypes = [
    "video/mp4",
    "video/x-msvideo",
    "video/quicktime",
    "video/x-matroska",
    "video/webm",
    "video/x-flv",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid MIME type for video file"));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
});

// Middleware to validate file type using magic numbers
export const validateFileType = async (
  req: Request,
  res: any,
  next: any
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const filePath = req.file.path;
    
    // Read first 4100 bytes for magic number validation
    const buffer = fs.readFileSync(filePath);
const type = await fileType.fromBuffer(buffer);

    // Allowed video MIME types based on magic numbers
    const allowedTypes = [
      "video/mp4",
      "video/x-msvideo",
      "video/quicktime",
      "video/x-matroska",
      "video/webm",
    ];

    if (!type || !allowedTypes.includes(type.mime)) {
      // Delete the invalid file
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: `Invalid file type detected. Expected video file, got: ${type?.mime || "unknown"}`,
      });
    }

    // File is valid, proceed
    next();
  } catch (error: any) {
    // Clean up file if validation fails
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({
      success: false,
      message: "File validation failed",
      error: error.message,
    });
  }
};

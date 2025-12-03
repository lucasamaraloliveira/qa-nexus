import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/scripts');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Keep original name but prepend timestamp to avoid collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Upload endpoint
router.post('/script', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Read file content to return it (optional, but useful for the editor)
        const content = fs.readFileSync(req.file.path, 'utf-8');

        res.json({
            path: req.file.path,
            filename: req.file.filename,
            originalName: req.file.originalname,
            content: content
        });
    } catch (error) {
        console.error('Error reading uploaded file:', error);
        res.status(500).json({ error: 'Failed to process uploaded file' });
    }
});

export default router;

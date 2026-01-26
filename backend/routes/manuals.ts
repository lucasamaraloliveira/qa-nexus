import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { AuditService } from '../services/auditService';

const router = express.Router();

// Helper to sanitize filename
const sanitizeFilename = (filename: string) => {
    return filename
        .normalize('NFD') // Decompose combined characters
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/[^a-zA-Z0-9.-]/g, "_"); // Replace other special chars with underscore
};

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeName = sanitizeFilename(file.originalname);
        cb(null, uniqueSuffix + '-' + safeName);
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log('Checking file:', file.originalname, 'Mimetype:', file.mimetype);
    const allowedTypes = [
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/pdf', // .pdf
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'image/jpeg', // .jpg
        'image/png' // .png
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only .doc, .docx, .pdf, .xls, .xlsx, .jpg, .png are allowed.`));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

// Routes

// Get all manuals (files and folders) for a specific parent
router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const parentId = req.query.parentId as string || null;

        const manuals = await db.manual.findMany({
            where: { parentId: parentId },
            orderBy: [
                { isFolder: 'desc' },
                { name: 'asc' }
            ]
        });

        res.json(manuals);
    } catch (error) {
        console.error('Error fetching manuals:', error);
        res.status(500).json({ error: 'Failed to fetch manuals' });
    }
});

// Create a folder
router.post('/folder', authenticateToken, async (req: any, res) => {
    try {
        const db = getDb();
        const { name, parentId } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        const newFolder = await db.manual.create({
            data: {
                name,
                originalName: name,
                type: 'folder',
                isFolder: true,
                parentId: parentId || null,
                uploadDate: new Date().toISOString(),
                size: 0
            }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'CREATE', 'MANUALS', newFolder.id.toString(), `Pasta criada ${name}`, req);

        res.json(newFolder);
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// Upload a manual
router.post('/', authenticateToken, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(500).json({ error: err.message });
        }
        next();
    });
}, async (req: any, res) => {
    if (!req.file) {
        console.error('No file received');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const db = getDb();
        const { filename, originalname, mimetype, size } = req.file;
        const parentId = req.body.parentId || null;
        console.log('File uploaded:', filename, size, 'Parent:', parentId);
        const uploadDate = new Date().toISOString();

        const safeDisplayName = sanitizeFilename(originalname);

        const newManual = await db.manual.create({
            data: {
                name: safeDisplayName,
                originalName: originalname,
                path: filename,
                type: mimetype,
                size: size,
                uploadDate: uploadDate,
                parentId: parentId,
                isFolder: false
            }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'UPLOAD', 'MANUALS', newManual.id.toString(), `Arquivo enviado ${originalname}`, req);

        res.json(newManual);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to save manual info' });
    }
});

// Delete a manual or folder
router.delete('/:id', authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    try {
        const db = getDb();
        const manual = await db.manual.findUnique({
            where: { id }
        });

        if (!manual) {
            return res.status(404).json({ error: 'Manual not found' });
        }

        if (manual.isFolder) {
            // Recurso não implementado no banco original também
        } else if (manual.path) {
            const filePath = path.join(__dirname, '../uploads', manual.path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await db.manual.delete({
            where: { id }
        });

        await AuditService.logAction(req.user.id, req.user.username, 'DELETE', 'MANUALS', id.toString(), `Excluído ${manual.isFolder ? 'pasta' : 'arquivo'} ${manual.name}`, req);

        res.json({ message: 'Manual deleted' });
    } catch (error) {
        console.error('Error deleting manual:', error);
        res.status(500).json({ error: 'Failed to delete manual' });
    }
});

export default router;

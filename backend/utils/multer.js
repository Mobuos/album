import multer from 'multer'
import path from 'node:path';
import fs from 'node:fs';

const __dirname = import.meta.dirname;

const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
    console.log(`[Startup] Upload directory does not exist. Creating: ${UPLOADS_DIR}`);
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, UPLOADS_DIR);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed.'), false);
        }
    },
});

export { UPLOADS_DIR, upload };

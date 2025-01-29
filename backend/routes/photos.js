import express from 'express';
import prisma from '../prisma.js'
import fs from 'node:fs';
import { upload } from '../multer.js';

const router = express.Router();

// Criar foto
router.post('/albums/:albumId/photos', upload.single('photo'), async (req, res) => {
    // FIXME: Usar autenticação
    const { albumId } = req.params;
    const { title, description, date, color } = req.body;
    
    // Validation
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded or invalid file type' });
    }

    const filePath = req.file.path;
    let fileSize = 0;

    try {
        // Get the file size in bytes
        const fileStats = fs.statSync(filePath);
        fileSize = fileStats.size;
    } catch (err) {
        console.error(`[Error] Failed to retrieve file size: ${err.message}`);
        return res.status(500).json({ error: 'Failed to process file' });
    }

    if (title == null || date == null) {
        fs.unlink(req.file.path);
        return res.status(400).json({ error: 'Missing required fields: "title" and "date"' });
    }

    // Validate date
    const isValidDate = (date) => !isNaN(Date.parse(date));

    if (!isValidDate(date)) {
        fs.unlink(req.file.path);
        return res.status(400).json({ error: 'Invalid "date" format, must be ISO 8601' });
    }

    const parsedDate = new Date(date);

    // Validate color
    if (color != null) {
        const isValidHexColor = (color) => /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(color);
    
        if (!isValidHexColor(color)) {
            fs.unlink(req.file.path);
            return res.status(400).json({ error: 'Invalid "color" format, must be a HEX code (e.g., #FFF or #FFFFFF)' });
        }
    }

    const albumIdInt = parseInt(albumId, 10);
    if (isNaN(albumIdInt)) {
        fs.unlink(req.file.path);
        return res.status(400).json({ error: 'Invalid "albumId" format' });
    }

    try {
        // Check if the album exists
        const album = await prisma.album.findUnique({ where: { id: albumIdInt } });
        if (!album) {
            fs.unlink(req.file.path);
            return res.status(404).json({ error: 'Album not found' });
        }

        const extractedColor = color || '#FFFFFF'; // TODO: Dynamically find color from image

        // Save photo
        const photo = await prisma.photo.create({
            data: {
                title,
                description,
                date: parsedDate,
                color: extractedColor,
                size: fileSize,
                filePath: `/uploads/${req.file.filename}`,
                album: { connect: { id: albumIdInt } },
            },
        });

        return res.status(201).json(photo);
    } catch (error) {
        console.error(error);
        fs.unlink(req.file.path);
        return res.status(500).json({ error: 'Failed to add photo' });
    }
});

router.get('/albums/:albumId/photos', async (req, res) => {
    // FIXME: Usar autenticação
    const { albumId } = req.params;

    const albumIdInt = parseInt(albumId, 10);
    if (isNaN(albumIdInt)) {
        return res.status(400).json({ error: 'Invalid "albumId" format' });
    }

    try {
        const albumPhotos = await prisma.album.findUnique({
            where: { id: albumIdInt },
            include: { photos: true },
        });

        if (!albumPhotos) {
            return res.status(404).json({ error: 'Album not found' });
        }

        const photos = albumPhotos.photos.map(photo => ({
            id: photo.id,
            title: photo.title,
            description: photo.description,
            date: photo.date,
            size: photo.size,
            color: photo.color,
            filePath: photo.filePath,
        }))

        res.status(200).json(photos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error retrieving photos' });
    }
});

router.get('/albums/:albumId/photos/:photoId', async (req, res) => {
    const { albumId, photoId } = req.params;

    const albumIdInt = parseInt(albumId, 10);
    const photoIdInt = parseInt(photoId, 10);

    if (isNaN(albumIdInt) || isNaN(photoIdInt)) {
        return res.status(400).json({ error: 'Invalid "albumId" or "photoId" format'});
    }

    try {
        const photo = await prisma.photo.findUnique({
            where: { id: photoIdInt, albumId: albumIdInt }
        });

        if (!photo) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        const { id, title, description, date, size, color, filePath, albumId } = photo;
        return res.json({ id, title, description, date, size, color, filePath });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error retrieving photo' });
    }
    
});

export default router;
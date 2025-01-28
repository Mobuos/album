import express, { application, json } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
const __dirname = import.meta.dirname;

const app = express();
const prisma = new PrismaClient();

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

// parses json and makes the data available in req.body
// will allow post requests (front) to send json data
app.use(json());

// serve the frontend
app.use(express.static('public'));

function error(err, req, res, next) {
    // if (!test) console.error(err.stack);
    console.error(err.stack);

    res.status(500);
    res.send('Internal Server Error');
}

// Criar novo usuário
app.post('/users', async (req, res) => {
    const { email, password } = req.body;
    if (email == null || password == null) {
        return res.status(400).json({ error: 'Email and password are required'})
    }

    try {
        // TODO: Enforce strong password
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await prisma.user.create({
            data: { email, password: hashedPassword },
        });
        res.status(201).json(newUser);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error creating user' });
    }
});

// Mock function for user login (Just to check if hashing is working for now)
app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    if (email == null || password == null) {
        return res.status(400).json({ error: 'Email and password are required'})
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found'});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        res.json({ message: 'Login successful'});
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Failed to log-in'});
    }
});

// Criar álbum
app.post('/albums', async (req, res) => {
    // FIXME: Usar autenticação
    const { title, description, userId } = req.body;

    if (title == null || userId == null) {
        return res.status(400).json({ error: '"title" and "userId" are required' });
    }

    try {
        // Checa se usuário existe
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' })
        }

        // TODO: tem como garantir isso no schema?
        // Nomes de albuns são únicos para cada usuário
        const existingAlbum = await prisma.album.findFirst({
            where: { title, user },
        });

        if (existingAlbum) {
            return res.status(409).json({ error: 'Album with this title already exists.' });
        }

        const newAlbum = await prisma.album.create({
            data: { 
                title, 
                description, 
                user: {
                    connect: { id: userId },
                }
            },
        });

        res.status(201).json(newAlbum);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create album.' })
    }
});

// Ver todos os álbuns de um usuário
app.get('/albums', async (req, res) => {
    // FIXME: Usar autenticação
    const { userId } = req.query;

    if (userId == null) {
        return res.status(400).json({ error: '"userId" is required' });
    }

    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
        return res.status(400).json({ error: 'Invalid "userId" format' });
    }

    try {
        const userAlbums = await prisma.user.findUnique({
            where: { id: userIdInt }, 
            include: { albums: true },
        });

        if (!userAlbums) {
            return res.status(404).json({ error: 'User not found' });
        }

        const albums = userAlbums.albums.map(album => ({
            id: album.id,
            title: album.title,
            description: album.description,
        }));

        res.status(200).json(albums);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error retrieving albums' });
    }
});

app.get('/albums/:albumId', async (req, res) => {
    // FIXME: Usar autenticação
    const { albumId } = req.params;

    if (albumId == null) {
        return res.status(400).json({ error: '"albumId" is required' });
    }

    const albumIdInt = parseInt(albumId, 10);
    if (isNaN(albumIdInt)) {
        return res.status(400).json({ error: 'Invalid "albumId" format' });
    }

    try {
        const album = await prisma.album.findUnique({
            where: { id: albumIdInt },
        });

        if (!album) {
            return res.status(404).json({ error: 'Album not found' });
        }

        return res.status(200).json(album);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Failed to get album' })
    }
});

app.patch('/albums/:albumId', async (req, res) => {
    // FIXME: Usar autenticação
    const { albumId } = req.params
    const { title, description } = req.body;

    if (albumId == null) {
        return res.status(400).json({ error: '"albumId" is required' });
    }

    const albumIdInt = parseInt(albumId, 10);
    if (isNaN(albumIdInt)) {
        return res.status(400).json({ error: 'Invalid "albumId" format' });
    }

    if (title == null && description == null) {
        return res.status(400)
            .json({ errror: 'At least one of "title" or "description" is required to update an album'})
    }

    try {
        const updatedAlbum = await prisma.album.update({
            where: { id: albumIdInt }, 
            data: {
                ...(title && { title }),
                ...(description && { description })
            },
        });

        return res.status(200).json(updatedAlbum);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Failed to get album' })
    }
});

// Deletar álbum
app.delete('/albums/:albumId', async (req, res) => {
    // FIXME: Só deletar o álbum se estiver vazio
    // FIXME: Usar autenticação
    const { albumId } = req.params

    if (albumId == null) {
        return res.status(400).json({ error: '"albumId" is required' });
    }

    const albumIdInt = parseInt(albumId, 10);
    if (isNaN(albumIdInt)) {
        return res.status(400).json({ error: 'Invalid "albumId" format' });
    }

    try {
        const album = await prisma.album.findUnique({
            where: { id: albumIdInt },
        });

        if (!album) {
            return res.status(404).json({ error: 'Album not found' });
        }

        await prisma.album.delete({
            where: { id: albumIdInt },
        });

        return res.status(200).json({ message: 'Album successfully deleted' });
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Failed to get album' })
    }
});

// Criar foto
app.post('/albums/:albumId/photos', upload.single('photo'), async (req, res) => {
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

app.get('/albums/:albumId/photos', async (req, res) => {
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


// Front-end
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

app.use(error);

export default app;
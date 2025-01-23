import express, { application, json } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const app = express();
const prisma = new PrismaClient();

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
        res.status(500).json({ error: 'Error retrieving albums' })
    }
});

app.get('/albums/:albumId', async (req, res) => {
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

app.delete('/albums/:albumId', async (req, res) => {
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

// Front-end
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

app.use(error);

export default app;
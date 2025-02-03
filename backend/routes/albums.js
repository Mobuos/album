import express from 'express';
import prisma from '../utils/prisma.js'
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

// Criar álbum
router.post('/albums', async (req, res) => {
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
router.get('/albums', authenticateToken, async (req, res) => {
    try {
        const userAlbums = await prisma.user.findUnique({
            where: { id: req.user.userId }, 
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

router.get('/albums/:albumId', async (req, res) => {
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

router.patch('/albums/:albumId', async (req, res) => {
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
router.delete('/albums/:albumId', async (req, res) => {
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

export default router;

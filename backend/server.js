import express, { json } from 'express';
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

var counter = 0;

app.get('/counter', (req, res) => {
    res.json({ value: counter });
});

app.post('/counter', (req, res) => {
    counter += 1;
    res.json({ value: counter });
});

app.get('/test', (req, res) => {
    // res.status(201).json({ message: '201!' });
    res.json({ message: 'Hello World!!' });

    // throw new Error('test');
});

// Criar novo usuário
app.post('/users', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
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

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required'})
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({error: 'User not found'});
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

    if (!title || !userId) {
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
            data: { title, description, user: {
                connect: { id: userId },
            }},
        });

        res.status(201).json(newAlbum);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create album.' })
    }
});

// Front-end
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

app.use(error);

export default app;
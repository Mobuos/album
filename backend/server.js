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

app.post('/users', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required'})
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await prisma.user.create({
            data: { email, hashedPassword },
        });
        res.status(201).json(newUser);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error creating user' });
    }
});

app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        const isPasswordValid = await bcrypt.compare(password. user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        res.json({ message: 'Login successful'});
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Failed to log-in'});
    }
});

// Front-end
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

app.use(error);

export default app;
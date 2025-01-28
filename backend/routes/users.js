import express from 'express';
import prisma from '../prisma.js'
import bcrypt from 'bcrypt';

const router = express.Router();

// Criar novo usuário
router.post('/users', async (req, res) => {
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
router.post('/login', async (req, res) => {
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

export default router;
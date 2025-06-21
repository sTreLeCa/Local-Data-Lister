// backend/src/routes/auth.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma'; // This line might still be red for now

const router = express.Router();

// --- The "Register" Door ---
// Path: POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // Make sure they gave us an email and password
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Check if someone with this email already has a key
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    // Scramble the password before saving it!
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user in our database toy box
    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
      },
    });

    // Create a new secret key (JWT) for the new user
    const userForToken = { userId: user.id, email: user.email };
    const token = jwt.sign(userForToken, process.env.JWT_SECRET!, { expiresIn: '1d' });

    // Send the key back to them
    res.status(201).json({ message: 'User registered successfully!', token });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Something went wrong on our end.' });
  }
});

// --- The "Login" Door ---
// Path: POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Find the user trying to log in
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't tell them the user doesn't exist, it's less secure.
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    // Check if the password they gave matches the scrambled one we have stored
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    // If password is correct, create a new key for them
    const userForToken = { userId: user.id, email: user.email };
    const token = jwt.sign(userForToken, process.env.JWT_SECRET!, { expiresIn: '1d' });

    // Send them their new key
    res.status(200).json({ message: 'Logged in successfully!', token });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Something went wrong on our end.' });
  }
});

export default router;
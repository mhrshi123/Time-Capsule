// server/index.js

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { authenticateToken, generateAccessToken } = require("./auth");
require("dotenv").config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Health check
app.get("/", (req, res) => res.send("Time Capsule API"));

// Signup
app.post("/signup", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "Email and password required" });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { email, password: hashedPassword },
    });

    const token = generateAccessToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
});

// Login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "Email and password required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateAccessToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
});

// Get all capsules for a user
app.get("/capsules", authenticateToken, async (req, res) => {
    const allCapsules = await prisma.capsule.findMany({
        where: { ownerId: req.user.id },
        orderBy: { unlockDate: "asc" },
        select: {
            id: true,
            title: true,
            message: true,
            unlockDate: true,
            isPublic: true,
            slug: true,
        },
    });

    const now = new Date();

    const safeCapsules = allCapsules.map(c => ({
        id: c.id,
        title: c.title,
        unlockDate: c.unlockDate,
        isPublic: c.isPublic,
        slug: c.slug,
        message: now >= c.unlockDate ? c.message : null,
    }));

    res.json(safeCapsules);
});

// Create a capsule
app.post("/capsules", authenticateToken, async (req, res) => {
    const { title, message, unlockDate, isPublic } = req.body;
    if (!title || !message || !unlockDate)
        return res.status(400).json({ error: "Missing required fields" });

    const capsule = await prisma.capsule.create({
        data: {
            title,
            message,
            unlockDate: new Date(unlockDate),
            isPublic: Boolean(isPublic),
            ownerId: req.user.id,
        },
        select: {
            id: true,
            title: true,
            message: true,
            unlockDate: true,
            isPublic: true,
            slug: true,
        },
    });

    res.json(capsule);
});

// Get capsule by slug
app.get("/capsules/slug/:slug", authenticateToken, async (req, res) => {
    const { slug } = req.params;
    const capsule = await prisma.capsule.findUnique({ where: { slug } });

    if (!capsule) return res.status(404).json({ error: "Not found" });
    if (!capsule.isPublic && capsule.ownerId !== req.user.id)
        return res.status(403).json({ error: "Unauthorized" });

    const now = new Date();
    if (now < capsule.unlockDate)
        return res.json({ status: "locked", unlocksAt: capsule.unlockDate });

    return res.json({
        status: "unlocked",
        capsule: {
            id: capsule.id,
            title: capsule.title,
            message: capsule.message,
            unlockDate: capsule.unlockDate,
        },
    });
});

// Delete capsule
app.delete("/capsules/:id", authenticateToken, async (req, res) => {
    const capsule = await prisma.capsule.findUnique({
        where: { id: Number(req.params.id) },
    });

    if (!capsule) return res.status(404).json({ error: "Capsule not found" });
    if (capsule.ownerId !== req.user.id)
        return res.status(403).json({ error: "Access denied" });

    await prisma.capsule.delete({ where: { id: capsule.id } });
    res.json({ message: "Capsule deleted" });
});

// Public capsule view
app.get("/capsules/public/:slug", async (req, res) => {
    const capsule = await prisma.capsule.findUnique({
        where: { slug: req.params.slug },
    });

    if (!capsule || !capsule.isPublic)
        return res.status(404).json({ error: "Capsule not found or not public" });

    const now = new Date();
    if (now < capsule.unlockDate)
        return res.json({ status: "locked", unlocksAt: capsule.unlockDate });

    return res.json({ status: "unlocked", capsule });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

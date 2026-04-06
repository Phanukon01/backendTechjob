import express from "express";
import {
    getUserById,
    updateUser,
    updatePassword,
    register,
    login,
    resetPasswordByEmail
} from "../controllers/UserController.js";

const router = express.Router();

// --- Auth Routes ---
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", resetPasswordByEmail);

// --- User Routes ---
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.patch("/:id/password", updatePassword);

export default router;
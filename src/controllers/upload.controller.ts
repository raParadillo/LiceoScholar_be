import type { Context } from "hono";
import { writeFile, unlink } from "fs/promises";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import pool from "../config/db.js";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "profile-photos");


async function ensureUploadDir() {
    if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
    }
}

export async function uploadProfilePhoto(context: Context) {
    try {
       await ensureUploadDir();

        const body = await context.req.parseBody();
        const file = body.file as File;
        const userId = body.userId as string;

        await deletePreviousPhoto(userId);

        if (!file || !userId) {
            return context.json({ message: "File and userId required" }, 400);
        }

   
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return context.json({ message: "Invalid file type. Only JPEG, PNG, GIF, WebP allowed" }, 400);
        }

      
        const maxSize = 5 * 1024 * 1024; 
        if (file.size > maxSize) {
            return context.json({ message: "File too large. Max 5MB" }, 400);
        }

      
        const ext = path.extname(file.name) || '.jpg';
        const filename = `user-${userId}-${Date.now()}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);

       
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filepath, buffer);

       
        const relativePath = `/uploads/profile-photos/${filename}`;
        
        await pool.query(
            "UPDATE users SET ProfilePhoto = ? WHERE UserID = ?",
            [relativePath, userId]
        );

    
        return context.json({
            message: "Photo uploaded successfully",
            photoUrl: relativePath
        }, 200);

    } catch (error) {
        console.error("Upload error:", error);
        return context.json({ message: "Error uploading photo" }, 500);
    }
}

async function deletePreviousPhoto(userId: string) {
    const [rows] = await pool.query<any[]>(
        "SELECT ProfilePhoto FROM users WHERE UserID = ?",
        [userId]
    );
    
    if (rows.length > 0 && rows[0].ProfilePhoto) {
        const fullPath = path.join(process.cwd(), rows[0].ProfilePhoto);
        if (existsSync(fullPath)) {
            await unlink(fullPath);
        }
    }
    const [result] = await pool.query<any[]>(
        "UPDATE users SET ProfilePhoto = NULL WHERE UserID = ?",
        [userId]
    );
    console.log(result);
}

export async function getProfilePhoto(context: Context) {
    try {
        const userId = context.req.param('userId');

        const [rows] = await pool.query<any[]>(
            "SELECT ProfilePhoto FROM users WHERE UserID = ?",
            [userId]
        );

        if (rows.length === 0 || !rows[0].ProfilePhoto) {
            return context.json({ photoUrl: null }, 200);
        }

        return context.json({ photoUrl: rows[0].ProfilePhoto }, 200);

    } catch (error) {
        console.error("Get photo error:", error);
        return context.json({ message: "Error fetching photo" }, 500);
    }
}

export async function deleteProfilePhoto(context: Context) {
    try {
        const userId = context.req.param('userId');

      
        const [rows] = await pool.query<any[]>(
            "SELECT ProfilePhoto FROM users WHERE UserID = ?",
            [userId]
        );

        if (rows.length === 0) {
            return context.json({ message: "User not found" }, 404);
        }

        const photoPath = rows[0].ProfilePhoto;
        if (!photoPath) {
            return context.json({ message: "No photo to delete" }, 400);
        }

        const fullPath = path.join(process.cwd(), photoPath);
        if (existsSync(fullPath)) {
            await unlink(fullPath);
        }

        await pool.query(
            "UPDATE users SET ProfilePhoto = NULL WHERE UserID = ?",
            [userId]
        );

        return context.json({ message: "Photo deleted successfully" }, 200);

    } catch (error) {
        console.error("Delete photo error:", error);
        return context.json({ message: "Error deleting photo" }, 500);
    }
}

export async function uploadRequirementphoto(context: Context) {
    try {
        const userId = context.req.param('userId');
        const requirementID = context.req.param('requirementID');



        
    } catch (error) {
        console.error("Upload requirement error:", error);
        return context.json({ message: "Error uploading requirement" }, 500);
    }
}
export async function deleteRequirementPhoto(context: Context) {
    try {
        const userId = context.req.param('userId');
        const requirementID = context.req.param('requirementID');
    } catch (error) {
        console.error("Delete requirement error:", error);
        return context.json({ message: "Error deleting requirement" }, 500);
    }
}
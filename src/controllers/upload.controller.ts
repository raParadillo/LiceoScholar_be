import type { Context } from "hono";
import { writeFile, unlink } from "fs/promises";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import pool from "../config/db.js";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "profile-photos");
const REQUIREMENT_DIR = path.join(process.cwd(), "uploads", "requirement-documents");


async function ensureUploadDir() {
    if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
    }
}

async function ensureRequirementDir() {
    if (!existsSync(REQUIREMENT_DIR)) {
        await mkdir(REQUIREMENT_DIR, { recursive: true });
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

export async function uploadRequirementDocument(context: Context) {
    try {
        await ensureRequirementDir();
        
        

        const body = await context.req.parseBody();
        
        const file = body.file as File;
        const userId = body.userId as string;
        const requirementID = body.requirementID as string;
        
        await deletePreviousRequirementDocument(userId, requirementID);

        if (!file || !userId || !requirementID) {
            return context.json({ message: `Missing: file=${!!file}, userId=${userId}, requirementID=${requirementID}` }, 400);
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return context.json({ message: "Invalid file type. Only JPEG, PNG, and WebP allowed" }, 400);
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return context.json({ message: "File too large. Max 5MB" }, 400);
        }

        const ext = path.extname(file.name) || '.jpg';
        const filename = `requirement-${userId}-${requirementID}-${Date.now()}${ext}`;
        const filepath = path.join(REQUIREMENT_DIR, filename);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filepath, buffer);

        const relativePath = `/uploads/requirement-documents/${filename}`;

        const [result] = await pool.query(
            "UPDATE requirements SET requirementDoc = ? WHERE UserID = ? AND requirementID = ?",
            [relativePath, userId, requirementID]
        ) as any;

        console.log('Rows affected:', result.affectedRows);
        
        if (result.affectedRows === 0) {
            return context.json({ message: "No matching requirement found to update" }, 404);
        }

        return context.json({
            message: "Document uploaded successfully",
            documentUrl: relativePath
        }, 200);

    } catch (error: any) {
        console.error("Upload requirement error:", error);
        return context.json({ message: "Error uploading document:" + error.message }, 500);
    }
}
export async function deletePreviousRequirementDocument(userId: string, requirementID: string) {
    try {
        
        
        if (!userId || !requirementID) {
            return { message: "Missing userId or requirementID" };
        }   

        const [rows] = await pool.query(
            "SELECT requirementDoc FROM requirements WHERE UserID = ? AND requirementID = ?",
            [userId, requirementID]
        ) as any;

        if (rows.length > 0 && rows[0].requirementDoc) {
        const fullPath = path.join(process.cwd(), rows[0].requirementDoc);
        if (existsSync(fullPath)) {
            await unlink(fullPath);
        }
    }
        const [result] = await pool.query(
            "UPDATE requirements SET requirementDoc = NULL WHERE UserID = ? AND requirementID = ?",
            [userId, requirementID]
        ) as any;

        console.log('Rows affected:', result.affectedRows);
        
        if (result.affectedRows === 0) {
            return { message: "No matching requirement found to update" };
        }

        return {
            message: "Document deleted successfully"
        };

    } catch (error: any) {
        console.error("Delete requirement error:", error);
        
    }

    
}

export async function deleteRequirement(context: Context) {
    try {
        const userId = context.req.param('userId');
        const requirementID = context.req.param('requirementID');
        await deletePreviousRequirementDocument(userId!, requirementID!);
        return context.json({ message: "Requirement deleted successfully" }, 200);
    } catch (error: any) {
        console.error("Delete requirement error:", error);
        return context.json({ message: "Error deleting requirement:" + error.message }, 500);
    }
}
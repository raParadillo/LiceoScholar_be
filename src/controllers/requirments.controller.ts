import type { Context } from "hono";
import pool from "../config/db.js";
import { stat } from "fs";

const defaultRequirements = [
    { requirementID: "1", requirementName: "Form138" },
    { requirementID: "2", requirementName: "GoodMoral" },
    { requirementID: "3", requirementName: "BirthCert" }
];

export async function createRequirementsForUserByID(userID: string | number) {
    for (const req of defaultRequirements) {
        await pool.query(
            "INSERT INTO requirements (requirementID, userID, requirementName, status) VALUES (?, ?, ?, 'Missing')",
            [req.requirementID, userID, req.requirementName]
        );
    }
}

export async function createRequirementsForUser(context: Context) {
    try {
        const userID = context.req.param("userID");
        if (!userID) {
            return context.json({ message: "UserID is required" }, 400);
        }
        await createRequirementsForUserByID(userID);
        return context.json({ message: "Requirements created successfully" }, 201);
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error creating requirements" }, 500);
    }
}

export async function getRequirementsByUserID(context: Context) {
    try {
        const userID = context.req.param("userID");
        const [rows] = await pool.query("SELECT * FROM requirements WHERE UserID = ?", [userID]);
        return context.json(rows);
    } catch (error) {
        return context.json({ message: "Error getting requirements" }, 500);
    }
}

export async function updateRequirementStatus(context: Context) {
    try {
        const requirementID = context.req.param("requirementID");
        const userID = context.req.param("userID");
        const status = context.req.param("status");
        
        if (!requirementID || !userID || !status) {
            return context.json({ message: "RequirementID, userID and status are required" }, 400);
        }
        await pool.query("UPDATE requirements SET status = ? WHERE requirementID = ? AND userID = ?", [status, requirementID, userID]);
        return context.json({ message: "Requirement status updated successfully" }, 200);
    } catch (error) {
        return context.json({ message: "Error updating requirement status" }, 500);
    }
}

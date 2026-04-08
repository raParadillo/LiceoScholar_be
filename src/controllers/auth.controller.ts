import type { Context } from "hono";
import { sign, decode } from 'hono/jwt';
import pool from "../config/db.js";
import type { UserModel, CreateUserModel } from "../models/users.model.ts";
import bcrypt from "bcryptjs";
import type { ResultSetHeader } from "mysql2";
import nodemailer from "nodemailer";

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP credentials not configured in environment variables");
}

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function register(context: Context) {
    try {
        const userData: CreateUserModel = await context.req.json();
        const hashedPassword = await bcrypt.hash(userData.Password, 10);

        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO users (FirstName, LastName, Email, Password, RoleID, CourseID, Phone_Number) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                userData.FirstName,
                userData.LastName,
                userData.Email,
                hashedPassword,
                2,
                userData.CourseID,
                userData.Phone_Number
            ]
        );

        if (result) {
            const id = result.insertId;
            const [rows] = await pool.query<UserModel[]>(
                "SELECT UserID, FirstName, LastName, Email, RoleID FROM users WHERE UserID = ?",
                [id]
            );
            const user = rows[0];

            const payload = {
                userId: user.UserID,
                email: user.Email,
                role: user.RoleID
            };

            const token = await sign(payload, process.env.JWT_SECRET || 'fallback-secret');

            return context.json({
                message: "User registered successfully",
                token,
                user: {
                    UserID: user.UserID,
                    FirstName: user.FirstName,
                    LastName: user.LastName,
                    Email: user.Email,
                    RoleID: user.RoleID
                }
            }, 201);
        }
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error registering user" }, 500);
    }
}


export async function login(context: Context) {
    try {
        const { Email, Password } = await context.req.json();

        const [users] = await pool.query<UserModel[]>(
            `SELECT * FROM users WHERE Email = ?`,
            [Email]
        );

        if (users.length === 0) {
            return context.json({ message: "Invalid credentials" }, 401);
        }

        const user = users[0];
        
        const isValidPassword = await bcrypt.compare(Password, user.Password);
        
        if (!isValidPassword) {
            return context.json({ message: "Invalid credentials" }, 401);
        }
        
        const payload = {
            userId: user.UserID,
            email: user.Email,
            role: user.RoleID
        };

        const token = await sign(payload, process.env.JWT_SECRET || 'fallback-secret');

        return context.json({
            message: "Login successful",
            token,
            user: {
                UserID: user.UserID,
                FirstName: user.FirstName,
                LastName: user.LastName,
                Email: user.Email,
                RoleID: user.RoleID
            }
        }, 200);
        
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error during login" }, 500);
    }
    
}

export async function getMe(context: Context) {
    try {
        const token = context.req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return context.json({ message: "No token provided" }, 401);
        }

        const { payload } = decode(token);
        const userId = payload.userId;

        const [users] = await pool.query<UserModel[]>(
            `SELECT UserID, FirstName, LastName, Email, RoleID FROM users WHERE UserID = ?`,
            [userId]
        );

        if (users.length === 0) {
            return context.json({ message: "User not found" }, 404);
        }

        return context.json({
            user: users[0]
        }, 200);

    } catch (error) {
        console.log(error);
        return context.json({ message: "Invalid token" }, 401);
    }
}

export async function requestPasswordReset(context: Context) {
    try {
        const { Email } = await context.req.json();

        const [users] = await pool.query<UserModel[]>(
            "SELECT UserID, Email, FirstName FROM users WHERE Email = ?",
            [Email]
        );

        if (users.length === 0) {
            return context.json({ message: "User not found" }, 404);
        }

        const user = users[0];
        const otp = generateOTP();

        await pool.query(
            "INSERT INTO otp (UserID, OTP_Code, OTP_Type, Created_at, Is_Used) VALUES (?, ?, 'password_reset', NOW(), 0)",
            [user.UserID, otp]
        );

        await transporter.sendMail({
            from: SMTP_USER,
            to: user.Email,
            subject: "Password Reset OTP",
            html: `
                <h2>Password Reset Request</h2>
                <p>Hi ${user.FirstName},</p>
                <p>Your OTP for password reset is: <strong>${otp}</strong></p>
                <p>This code expires in 10 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });

        return context.json({ message: "OTP sent to email" }, 200);
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error sending OTP" }, 500);
    }
}

export async function resetPassword(context: Context) {
    try {
        const { OTP_Code, NewPassword } = await context.req.json();

        // Look up the OTP to get the UserID directly
        const [resets] = await pool.query<any[]>(
            "SELECT UserID FROM otp WHERE OTP_Code = ? AND OTP_Type = 'password_reset' AND Is_Used = 0 AND Created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)",
            [OTP_Code]
        );

        if (resets.length === 0) {
            return context.json({ message: "Invalid or expired OTP" }, 400);
        }

        const userId = resets[0].UserID;

        const hashedPassword = await bcrypt.hash(NewPassword, 10);

        await pool.query(
            "UPDATE users SET Password = ? WHERE UserID = ?",
            [hashedPassword, userId]
        );

        await pool.query(
            "UPDATE otp SET Is_Used = 1 WHERE UserID = ? AND OTP_Code = ?",
            [userId, OTP_Code]
        );

        return context.json({ message: "Password reset successfully" }, 200);
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error resetting password" }, 500);
    }
}
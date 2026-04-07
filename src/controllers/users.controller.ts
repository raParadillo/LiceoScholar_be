import type { Context } from "hono";
import pool from "../config/db.js";
import type { CreateUserModel, UserModel, UserProfile } from "../models/users.model.js";
import type{RowDataPacket, ResultSetHeader } from "mysql2";
import bcrypt from "bcryptjs";

type JWTPayload = {
    userId: number;
    email: string;
    role: number;
};

export async function getAllUsers(context: Context) {
    try {
        const [rows] = await pool.query<UserModel[]>("SELECT UserID, FirstName, LastName, Email, Password, RoleID, CourseID, Phone_number from users ORDER BY UserID DESC");
        return context.json(rows, 200);
    } catch (error) {
        console.log(error);
        return context.json({message: "Error fetching users"}, 500);
    }

}

export async function getUserById(context: Context) {
    try {
     const id = context.req.param("id");
     const [rows] = await pool.query<UserModel[]>("SELECT UserID, FirstName, LastName, Email, Password, RoleID, CourseID, Phone_number from users WHERE UserID = ?", [id]);
     const data =rows[0];

     if(data) {
        return context.json(data, 200);
     }else{
        return context.json(null, 200);
     }
     
    } catch (error) {
        console.log(error);
        return context.json({message: "Error fetching user"}, 500);
    }
    
}


export async function getUserProfile(context: Context){
    try {
        const id = context.req.param("id");
        const [rows] = await pool.query<UserProfile[]>(
            `SELECT 
                CONCAT(users.LastName, ', ', users.FirstName) AS FullName, 
                courses.CourseCode AS Course,
                CONCAT(scholarships.Scholarship_Name, ' (', scholarships.Scholarship_Type, ')') AS Scholarship,
                users.Email,
                users.Phone_Number
            FROM users 
            JOIN courses ON users.CourseID = courses.CourseID 
            JOIN applications ON users.UserID = applications.UserID
            JOIN scholarships ON applications.ScholarshipID = scholarships.ScholarshipID
            WHERE users.UserID = ?`,
            [id]
        );

        if (rows.length === 0) {
            return context.json({ message: "User profile not found" }, 404);
        }

        return context.json(rows, 200);
    } catch (error) {
        console.log(error);
        return context.json({message: "Error fetching user Profile"}, 500);
    }
}
    

export async function searchUserByName(context: Context){
    try {
        const name = context.req.param("name");
        
        const [rows] = await pool.query<UserModel[]>("SELECT UserID, FirstName, LastName, Email, Password, RoleID, CourseID, Phone_number FROM users WHERE CONCAT(FirstName, ' ', LastName) LIKE ? ORDER BY UserID DESC", [`%${name}%`]);
        if (rows.length === 0) {
            return context.json({ message: "No users found" }, 404);
        }
        
        return context.json(rows,200);
    } catch (error) {
        console.log(error);
        return context.json({message: "Error searching user"}, 500);
    }
}


export async function createUser(context: Context) {
    try {
        const userData: CreateUserModel = await context.req.json();
        const hashedPassword = await bcrypt.hash(userData.Password, 10);

        const [result] = await pool.query<ResultSetHeader>("INSERT INTO users (FirstName, LastName, Email, Password, RoleID, CourseID, Phone_Number) VALUES (?, ?, ?, ?, ?, ?, ?)", [
            userData.FirstName,
            userData.LastName,
            userData.Email,
            hashedPassword,
            userData.RoleID,
            userData.CourseID,
            userData.Phone_Number
        ]);
        if (result){
            const id = result.insertId;
            const [rows] = await pool.query<UserModel[]>("SELECT * from users WHERE UserID = ?", [id]);
            const data = rows[0];
            return context.json({message: "User created successfully"}, 201);
        }
    } catch (error) {
       console.log(error);
        return context.json({message: "Error creating user"}, 500);
    }
}

export async function updateUserById(context: Context) {
    try {
        const id = context.req.param("id");
        const userData: CreateUserModel = await context.req.json();
        const hashedPassword = await bcrypt.hash(userData.Password, 10);

        const [result] = await pool.query<ResultSetHeader>("UPDATE users SET FirstName = ?, LastName = ?, Email = ?, Password = ?, RoleID = ?, CourseID = ?, Phone_Number = ? WHERE UserID = ?", [
            userData.FirstName,
            userData.LastName,
            userData.Email,
            hashedPassword,
            userData.RoleID,
            userData.CourseID,
            userData.Phone_Number,
            id
        ]);
        if (result){
            const [rows] = await pool.query<UserModel[]>("SELECT * from users WHERE UserID = ?", [id]);
            const data = rows[0];
            return context.json({message: "User updated successfully"}, 200);
        }
    } catch (error) {
        console.log(error);
        return context.json({message: "Error updating user"}, 500);
    }
}


export async function deleteUserById(context: Context) {
    try {
        const id = context.req.param("id");
        const [result] = await pool.query<ResultSetHeader>("DELETE FROM users WHERE UserID = ?", [id]);
        if (result.affectedRows > 0){
            return context.json({message: "User deleted successfully"}, 200);
        }else{
            return context.json({message: "User not found"}, 404);
        }
    } catch (error) {
        console.log(error);
        return context.json({message: "Error deleting user"}, 500);
    }
}

    
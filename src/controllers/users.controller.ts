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
                users.SchoolID,
                CONCAT(users.LastName, ', ', users.FirstName) AS FullName, 
                courses.CourseName AS Course,
                COALESCE(CONCAT(scholarships.Scholarship_Name, ' (', scholarships.Scholarship_Type, ')'), 'No Scholarship') AS Scholarship,
                users.Email,
                users.Phone_Number
            FROM users 
            LEFT JOIN courses ON users.CourseID = courses.CourseID 
            LEFT JOIN applications ON users.UserID = applications.UserID AND applications.Scholarship_Status = 'Approved'
            LEFT JOIN scholarships ON applications.ScholarshipID = scholarships.ScholarshipID
            WHERE users.UserID = ?`,
            [id]
        );

        if (rows.length === 0) {
            return context.json({ message: "User profile not found" }, 404);
        }

        return context.json(rows[0], 200);
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
        const userData: Partial<CreateUserModel> = await context.req.json();

        // Build dynamic update query based on provided fields
        const updates: string[] = [];
        const values: any[] = [];

        if (userData.SchoolID !== undefined) {
            updates.push("SchoolID = ?");
            values.push(userData.SchoolID);
        }
        if (userData.FirstName !== undefined) {
            updates.push("FirstName = ?");
            values.push(userData.FirstName);
        }
        if (userData.LastName !== undefined) {
            updates.push("LastName = ?");
            values.push(userData.LastName);
        }
        if (userData.Email !== undefined) {
            updates.push("Email = ?");
            values.push(userData.Email);
        }
        if (userData.Phone_Number !== undefined) {
            updates.push("Phone_Number = ?");
            values.push(userData.Phone_Number);
        }
        if (userData.Password !== undefined && userData.Password) {
            const hashedPassword = await bcrypt.hash(userData.Password, 10);
            updates.push("Password = ?");
            values.push(hashedPassword);
        }
        if (userData.RoleID !== undefined) {
            updates.push("RoleID = ?");
            values.push(userData.RoleID);
        }
        if (userData.CourseID !== undefined) {
            updates.push("CourseID = ?");
            values.push(userData.CourseID);
        }

        if (updates.length === 0) {
            return context.json({message: "No fields to update"}, 400);
        }

        values.push(id);
        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE users SET ${updates.join(", ")} WHERE UserID = ?`,
            values
        );

        if (result.affectedRows > 0){
            return context.json({message: "User updated successfully"}, 200);
        } else {
            return context.json({message: "User not found"}, 404);
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

export async function getStudentsList(context: Context) {
    try {
        const [rows] = await pool.query(`
            SELECT 
                u.SchoolID,
                u.UserID,
                CONCAT(u.LastName, ', ', u.FirstName) AS FullName,
                u.Email,
                c.CourseCode AS Course,
                CASE 
                    WHEN COUNT(CASE WHEN a.Scholarship_Status = 'Approved' THEN 1 END) > 0 
                    THEN 'Yes' 
                    ELSE 'No' 
                END AS IsActiveScholar
            FROM users u
            LEFT JOIN applications a ON u.UserID = a.UserID
            LEFT JOIN courses c ON u.CourseID = c.CourseID
            WHERE u.RoleID = 2
            GROUP BY u.UserID, u.LastName, u.FirstName, u.Email, c.CourseCode
            ORDER BY u.LastName, u.FirstName
        `);
        return context.json(rows, 200);
    } catch (error) {
        console.log(error);
        return context.json({message: "Error fetching students list"}, 500);
    }
}
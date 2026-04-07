import pool from "../config/db.js";
import bcrypt from "bcryptjs";
export async function getAllUsers(context) {
    try {
        const [rows] = await pool.query("SELECT * from users");
        return context.json(rows, 200);
    }
    catch (error) {
        console.log(error);
        return context.json({ message: "Error fetching users" }, 500);
    }
}
export async function getUserById(context) {
    try {
        const id = context.req.param("id");
        const [rows] = await pool.query("SELECT * from users WHERE UserID = ?", [id]);
        const data = rows[0];
        if (data) {
            return context.json(data, 200);
        }
        else {
            return context.json(null, 200);
        }
    }
    catch (error) {
        console.log(error);
        return context.json({ message: "Error fetching user" }, 500);
    }
}
export async function searchUserByName(context) {
    try {
        const name = context.req.param("name");
        const [rows] = await pool.query("SELECT * FROM users WHERE CONCAT(FirstName, ' ', LastName) LIKE ?", [`%${name}%`]);
        if (rows.length === 0) {
            return context.json({ message: "No users found" }, 404);
        }
        return context.json(rows, 200);
    }
    catch (error) {
        console.log(error);
        return context.json({ message: "Error searching user" }, 500);
    }
}
export async function createUser(context) {
    try {
        const userData = await context.req.json();
        const hashedPassword = await bcrypt.hash(userData.Password, 10);
        const [result] = await pool.query("INSERT INTO users (FirstName, LastName, BirthDate, Sex, Email, Password, RoleID, CourseID, Phone_Number, Year_Level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
            userData.FirstName,
            userData.LastName,
            userData.Birthdate,
            userData.Sex,
            userData.Email,
            hashedPassword,
            userData.RoleID,
            userData.CourseID,
            userData.Phone_Number,
            userData.Year_Level
        ]);
        const formattedBirthdate = new Date(userData.Birthdate).toISOString().split('T')[0];
        if (result) {
            const id = result.insertId;
            const [rows] = await pool.query("SELECT * from users WHERE UserID = ?", [id]);
            const data = rows[0];
            return context.json({ message: "User created successfully" }, 201);
        }
    }
    catch (error) {
        console.log(error);
        return context.json({ message: "Error creating user" }, 500);
    }
}
export async function updateUserById(context) {
    try {
        const id = context.req.param("id");
        const userData = await context.req.json();
        const hashedPassword = await bcrypt.hash(userData.Password, 10);
        const [result] = await pool.query("UPDATE users SET FirstName = ?, LastName = ?, BirthDate = ?, Sex = ?, Email = ?, Password = ?, RoleID = ?, CourseID = ?, Phone_Number = ?, Year_Level = ? WHERE UserID = ?", [
            userData.FirstName,
            userData.LastName,
            userData.Birthdate,
            userData.Sex,
            userData.Email,
            hashedPassword,
            userData.RoleID,
            userData.CourseID,
            userData.Phone_Number,
            userData.Year_Level,
            id
        ]);
        const formattedBirthdate = new Date(userData.Birthdate).toISOString().split('T')[0];
        if (result) {
            const [rows] = await pool.query("SELECT * from users WHERE UserID = ?", [id]);
            const data = rows[0];
            return context.json({ message: "User updated successfully" }, 200);
        }
    }
    catch (error) {
        console.log(error);
        return context.json({ message: "Error updating user" }, 500);
    }
}
export async function deleteUserById(context) {
    try {
        const id = context.req.param("id");
        const [result] = await pool.query("DELETE FROM users WHERE UserID = ?", [id]);
        if (result.affectedRows > 0) {
            return context.json({ message: "User deleted successfully" }, 200);
        }
        else {
            return context.json({ message: "User not found" }, 404);
        }
    }
    catch (error) {
        console.log(error);
        return context.json({ message: "Error deleting user" }, 500);
    }
}
export async function getScholars(context) {
    try {
        const [rows] = await pool.query("SELECT COUNT(CASE WHEN Scholarship_Status = 'Approved' THEN 1 END) as Active_Scholars, COUNT(CASE WHEN Scholarship_Status != 'Approved' THEN 1 END) as NonActive_Scholars FROM applications");
        return context.json(rows[0], 200);
    }
    catch (error) {
        console.log(error);
        return context.json({ message: "Error fetching scholars" }, 500);
    }
}

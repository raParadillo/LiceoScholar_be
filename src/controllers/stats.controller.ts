import type { Context } from "hono";
import pool from "../config/db.js";
import type { ScholarStats, DailyApplicationsStats, UsersByCollegeStats } from "../models/stats.model.js";
    
export async function getScholars(context: Context){
    try {
        const [rows] = await pool.query<ScholarStats[]>(`
            SELECT 
                (SELECT COUNT(CASE WHEN Scholarship_Status = 'Approved' THEN 1 END) FROM applications) as Active_Scholarships,
                (SELECT COUNT(*) FROM users WHERE RoleID = 2) as Total_Users
        `);
        
        return context.json(rows[0], 200);
    } catch (error) {
        console.log(error);
        return context.json({message: "Error fetching scholars"}, 500);
    }
}

export async function getDailyApplicationsStats(context: Context){
    try {
        const [rows] = await pool.query<DailyApplicationsStats[]>("SELECT DATE_FORMAT(Submitted_Date, '%Y-%m-%d') as Date, COUNT(*) as Total_Applications FROM applications GROUP BY DATE_FORMAT(Submitted_Date, '%Y-%m-%d') ORDER BY Date ASC");
        return context.json(rows, 200);
    } catch (error) {
        console.log(error); 
        return context.json({message: "Error fetching applications"}, 500);
    }
}

export async function getUsersByCollege(context: Context){
    try {
        const [rows] = await pool.query<UsersByCollegeStats[]>(`
            SELECT 
                colleges.CollegeID,
                colleges.CollegeName,
                COUNT(users.UserID) as Total_Users
            FROM colleges
            LEFT JOIN courses ON colleges.CollegeID = courses.CollegeID
            LEFT JOIN users ON courses.CourseID = users.CourseID
            GROUP BY colleges.CollegeID, colleges.CollegeName
            ORDER BY colleges.CollegeID
        `);
        return context.json(rows, 200);
    } catch (error) {
        console.log(error); 
        return context.json({message: "Error fetching users by college"}, 500);
    }
}
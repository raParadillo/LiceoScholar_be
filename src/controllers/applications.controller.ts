import type { Context } from "hono";
import pool from "../config/db.js";
import type { ApplicationModel, SySem } from "../models/applications.model.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";


export async function getApplications(context: Context) {
    try {
        const [rows] = await pool.query<ApplicationModel[]>( //admin view of all applications
            `SELECT 
                users.SchoolID,
                applications.ApplicationID,
                applications.UserID,
                CONCAT(users.LastName, ', ', users.FirstName) AS FullName,
                courses.CourseCode AS Course,
                CONCAT(scholarships.Scholarship_Name, ' (', scholarships.Scholarship_Type, ')') AS ScholarshipType,
                DATE_FORMAT(applications.Submitted_Date, '%Y-%m-%d %H:%i') AS Application_Date,
                CONCAT(applications.SchoolYear, ' - ', CASE WHEN applications.Semester = 1 THEN '1st' WHEN applications.Semester = 2 THEN '2nd' END, ' sem') AS SchoolYear,
                applications.Scholarship_Status AS Status
            FROM applications
            JOIN users ON applications.UserID = users.UserID
            JOIN courses ON users.CourseID = courses.CourseID
            JOIN scholarships ON applications.ScholarshipID = scholarships.ScholarshipID
            ORDER BY applications.Submitted_Date DESC`
        );
        return context.json(rows, 200);
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error fetching applications" }, 500);
    }
}

export async function getApplicationsByStatus(context: Context) { //admin view of applications by status
    try {
        const status = context.req.param("status");

        const [rows] = await pool.query<ApplicationModel[]>(
            `SELECT 
                u.SchoolID,
                a.ApplicationID,
                a.UserID,
                CONCAT(u.LastName, ', ', u.FirstName) AS FullName,
                c.CourseCode AS Course,
                CONCAT(s.Scholarship_Name, ' (', s.Scholarship_Type, ')') AS ScholarshipType,
                DATE_FORMAT(a.Submitted_Date, '%Y-%m-%d %H:%i:%s') AS Application_Date,
                a.Scholarship_Status AS Status
            FROM applications a
            JOIN users u ON a.UserID = u.UserID
            JOIN courses c ON u.CourseID = c.CourseID
            JOIN scholarships s ON a.ScholarshipID = s.ScholarshipID
            WHERE a.Scholarship_Status = ? ORDER BY a.Submitted_Date`,
            [status]
        );

        return context.json(rows, 200);
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error fetching applications" }, 500);
    }
}

export async function getApplicationsByUserID(context: Context) { //students view their own applications
    try {
        const UserID = context.req.param("userID");

        const [rows] = await pool.query<ApplicationModel[]>(
            `SELECT 
                u.SchoolID,
                a.ApplicationID,
                a.UserID,
                CONCAT(u.LastName, ', ', u.FirstName) AS FullName,
                c.CourseCode AS Course,
                CONCAT(s.Scholarship_Name, ' (', s.Scholarship_Type, ')') AS ScholarshipType,
                DATE_FORMAT(a.Submitted_Date, '%Y-%m-%d %H:%i:%s') AS Application_Date,
                a.Scholarship_Status AS Status,
                a.SchoolYear,
                CASE 
                    WHEN a.Semester = 1 THEN '1st sem'
                    WHEN a.Semester = 2 THEN '2nd sem'
                END AS Semester
            FROM applications a
            JOIN users u ON a.UserID = u.UserID
            JOIN courses c ON u.CourseID = c.CourseID
            JOIN scholarships s ON a.ScholarshipID = s.ScholarshipID
            WHERE a.UserID = ? ORDER BY a.Submitted_Date DESC`,
            [UserID]
        );

        return context.json(rows, 200);
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error fetching applications" }, 500);
    }
}

export async function searchApplicationsByName(context: Context) {
    try {
        const name = context.req.param("name");

        const [rows] = await pool.query<ApplicationModel[]>(
            `SELECT 
                u.SchoolID,
                a.ApplicationID,
                a.UserID,
                CONCAT(u.LastName, ', ', u.FirstName) AS FullName,
                c.CourseCode AS Course,
                CONCAT(s.Scholarship_Name, ' (', s.Scholarship_Type, ')') AS ScholarshipType,
                DATE_FORMAT(a.Submitted_Date, '%Y-%m-%d %H:%i:%s') AS Application_Date,
                a.Scholarship_Status AS Status
            FROM applications a
            JOIN users u ON a.UserID = u.UserID
            JOIN courses c ON u.CourseID = c.CourseID
            JOIN scholarships s ON a.ScholarshipID = s.ScholarshipID
            WHERE CONCAT(u.FirstName, ' ', u.LastName) LIKE ?
            ORDER BY a.Submitted_Date DESC`,
            [`%${name}%`]
        );

        if (rows.length === 0) {
            return context.json({ message: "No applications found" }, 404);
        }

        return context.json(rows, 200);
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error searching applications" }, 500);
    }
}

export async function createApplication(context: Context) { //student applies for a scholarship
    try {
        const { UserID, ScholarshipID, SchoolYear, Semester } = await context.req.json();

        
        const [pendingRows] = await pool.query<ApplicationModel[]>(
            `SELECT ApplicationID FROM applications WHERE UserID = ? AND Scholarship_Status IN ('Pending', 'Approved')`,
            [UserID]
        );

        if (pendingRows.length > 0) {
            return context.json({ 
                message: "You already have an active or pending application. Please wait for it to be processed or finished before applying again." 
            }, 400);
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO applications (UserID, ScholarshipID, Scholarship_Status, Submitted_Date, SchoolYear, Semester) VALUES (?, ?, 'Pending', NOW(), ?, ?)`,
            [UserID, ScholarshipID, SchoolYear, Semester]
        );

        return context.json({ 
            message: "Application submitted successfully",
            applicationId: result.insertId 
        }, 201);
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error creating application" }, 500);
    }
}

export async function rejectApplication(context: Context) { //admin rejects an application
    try {
        const ApplicationID = context.req.param("ApplicationID");

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE applications SET Scholarship_Status = 'Rejected' WHERE ApplicationID = ? AND Scholarship_Status IN ('Pending', 'Approved')`,
            [ApplicationID]
        );

        return context.json({ 
            message: "Application rejected successfully",
            ApplicationID: ApplicationID,
            updatedCount: result.affectedRows 
        }, 200);
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error rejecting application" }, 500);
    }
}
export async function acceptApplication(context: Context) { //admin accepts an application
    try {
        const ApplicationID = context.req.param("ApplicationID");

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE applications SET Scholarship_Status = 'Approved' WHERE ApplicationID = ? AND Scholarship_Status IN ('Pending','Rejected')`,
            [ApplicationID]
        );

        return context.json({ 
            message: "Application approved successfully",
            ApplicationID: ApplicationID,
            updatedCount: result.affectedRows 
        }, 200);
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error accepting application" }, 500);
    }
}

export async function ChangeToPending(context: Context) { //change all applications to pending
    try {
        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE applications SET Scholarship_Status = 'Pending' Where ApplicationID = ?`,
            [context.req.param("ApplicationID")]
        );
        return context.json({ message: "Application changed to pending", updatedCount: result.affectedRows }, 200);
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error changing application to pending" }, 500);
    }
}

export async function semFinish(context: Context) { //admin finishes the semester (sets all pending and accepted applications to finished)
    try {
        // Update all applications to 'Finished' status
        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE applications SET Scholarship_Status = 'Finished' WHERE Scholarship_Status IN ('Pending', 'Approved')`
        );

        return context.json({ 
            message: "Semester finished - all applications marked as finished",
            updatedCount: result.affectedRows 
        }, 200);
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error finishing semester" }, 500);
    }
}


export async function getSySem(context: Context) {
    try {
        const [rows] = await pool.query<SySem[]>(
            `SELECT * FROM sy_sem Where sy_semID = 1`
        );
        return context.json(rows, 200);
    } catch (error) {
        console.log(error);
        return context.json({ message: "Error fetching sy_sem" }, 500);
    }
}

export async function updateSySem(context: Context) {
    try {
        const [rows] = await pool.query<SySem[]>(
            `SELECT sy_semID, Year_start, Year_end, Semester FROM sy_sem WHERE sy_semID = 1`
        );

        const sem = rows[0];
        let newYearStart = sem.Year_start;
        let newYearEnd = sem.Year_end;
        let newSemester = sem.Semester === 1 ? 2 : 1;

        if (sem.Semester === 2) {
            newYearStart += 1;
            newYearEnd += 1;
        }

        await pool.query(
            `UPDATE sy_sem SET Year_start = ?, Year_end = ?, Semester = ? WHERE sy_semID = 1`,
            [newYearStart, newYearEnd, newSemester]
        );

        return context.json({
            message: "Semester updated",
            newSemester,
            newYear: `${newYearStart}-${newYearEnd}`
        }, 200);
    } catch (error) {
        return context.json({ message: "Error updating semester" }, 500);
    }
}
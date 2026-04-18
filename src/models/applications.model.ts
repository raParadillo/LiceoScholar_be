import type { RowDataPacket } from "mysql2";

export interface ApplicationModel extends RowDataPacket {
    SchoolID: number;
    ApplicationID: number;
    UserID: number;
    LastNameFirstNameMI: string;
    CourseAndYearLevel: string;
    ScholarshipType: string;
    Application_Date: string;
    Status: 'Pending' | 'Approved' | 'Rejected' | 'Finished';
}

export interface SySem extends RowDataPacket {
    sy_semID: number;
    Year_start: number;
    Year_end: number;
    Semester: number;
}
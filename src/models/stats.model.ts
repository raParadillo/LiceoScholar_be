import type { RowDataPacket } from "mysql2";

export interface ScholarStats extends RowDataPacket {
    Active_Scholars: number;
    NonActive_Scholars: number;
}

export interface DailyApplicationsStats extends RowDataPacket {
    Date: string;
    Total_Applications: number;
}

export interface UsersByCollegeStats extends RowDataPacket {
    CollegeID: number;
    CollegeName: string;
    Total_Users: number;
}

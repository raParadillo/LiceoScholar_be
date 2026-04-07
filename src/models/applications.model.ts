import type { RowDataPacket } from "mysql2";

export interface ApplicationModel extends RowDataPacket {
    ApplicationID: number;
    UserID: number;
    LastNameFirstNameMI: string;
    CourseAndYearLevel: string;
    ScholarshipType: string;
    Application_Date: string;
    Status: 'Pending' | 'Approved' | 'Rejected' | 'Finished';
}

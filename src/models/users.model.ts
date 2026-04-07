import type { RowDataPacket } from "mysql2";

export interface UserModel extends RowDataPacket {
    UserID: number;
    FirstName: string;
    LastName: string;
    Birthdate: string;
    Sex: string;
    Email: string;
    Password: string;
    RoleID: number;
    CourseID: number;
    Phone_number: string;
    Year_Level: number;
}

export interface CreateUserModel {
    FirstName: string;
    LastName: string;
    Birthdate: string;
    Sex: string;
    Email: string;
    Password: string;
    RoleID: number;
    CourseID: number;
    Phone_Number: string;
    Year_Level: number;
}

export interface UserProfile extends RowDataPacket {
    FullName: string;
    Course_YrLevel: string;
    Scholarship: string;
    Sex: string;
    Age: number;
}


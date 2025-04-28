import db from '../database/models/index.js';
const { Student } = db;

export const generateStudentId = async () => {
    const ID_LENGTH = 10;
    const MAX_ATTEMPTS = 50;
    
    const generateNumericId = () => {
        const min = Math.pow(10, ID_LENGTH - 1); // 1000000000
        const max = Math.pow(10, ID_LENGTH) - 1; // 9999999999
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    let attempts = 0;
    let studentId;
    
    do {
        if (attempts >= MAX_ATTEMPTS) {
            throw new Error("Failed to generate unique student ID");
        }
        
        studentId = generateNumericId();
        attempts++;
    } while (await Student.findOne({ where: { studentId } }));

    return studentId;
};
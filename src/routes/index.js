import { Router } from "express";
import authRoutes from "./apis/auth/auth.routes.js";
import userRoutes from "./apis/users/user.routes.js";
import welcome from "./welcomeRoutes.js";
import attendanceRoutes from "./apis/attendance/attendance.route.js";
import studentRoutes from './apis/students/students.route.js';
import classRoutes from './apis/class/classRoutes.js';
import courseRoutes from './apis/course/courseRoutes.js';

const routes = Router();

routes.use('/api/auth',authRoutes);
routes.use('/api/auth',welcome);
routes.use('/api/auth',userRoutes);
routes.use('/api/auth',attendanceRoutes);
routes.use('/api/student', studentRoutes);
routes.use('/api/class', classRoutes);
routes.use('/api/course', courseRoutes);

export default routes
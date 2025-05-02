import { Router } from "express";
import authRoutes from "./apis/auth/auth.routes.js";
import userRoutes from "./apis/users/user.routes.js";
import welcome from "./welcomeRoutes.js";
import attendanceRoutes from "./apis/attendance/attendance.route.js";
import studentRoutes from './apis/students/students.route.js';
import classRouter from './apis/class/classRoutes.js';
import courseRouter from './apis/course/courseRoutes.js';
const routes = Router();

routes.use('/api/auth',authRoutes);
routes.use('/api',welcome);
routes.use('/api/users',userRoutes);
routes.use('/api/attendance',attendanceRoutes);
routes.use('/api/students', studentRoutes);
routes.use('/api/classes', classRouter);
routes.use('/api/courses', courseRouter);

export default routes


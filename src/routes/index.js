import { Router } from "express";
import authRoutes from "./apis/auth/auth.routes.js";
import userRoutes from "./apis/users/user.routes.js";
import welcome from "./welcomeRoutes.js";

const routes = Router();

routes.use('/api/auth',authRoutes);
routes.use('/api/auth',welcome);
routes.use('/api/auth',userRoutes);

export default routes
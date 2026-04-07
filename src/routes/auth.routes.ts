import { Hono } from "hono";
import { login, getMe, resetPassword, register, requestPasswordReset } from "../controllers/auth.controller.js";
    
const authRouter = new Hono();
 
authRouter.post("/login", login);
authRouter.get("/me", getMe);
authRouter.post("/forgot-password", requestPasswordReset);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/register", register); 

 
export default authRouter;
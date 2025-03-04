import { Router } from "express";
import { getUserData } from "../Controllers/user.controller.js";
import userAuth from "../Middleware/userAuth.middleware.js";

const userRouter = Router();

userRouter.get("/data", userAuth, getUserData);

export default userRouter;

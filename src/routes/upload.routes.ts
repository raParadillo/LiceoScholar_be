import { Hono } from "hono";
import { uploadProfilePhoto, getProfilePhoto, deleteProfilePhoto } from "../controllers/upload.controller.js";

const uploadRouter = new Hono();

uploadRouter.post("/profile-photo", uploadProfilePhoto);
uploadRouter.get("/profile-photo/:userId", getProfilePhoto);
uploadRouter.delete("/profile-photo/:userId", deleteProfilePhoto);

export default uploadRouter;

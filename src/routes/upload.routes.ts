import { Hono } from "hono";
import { uploadProfilePhoto, getProfilePhoto, deleteProfilePhoto, uploadRequirementDocument, deleteRequirement } from "../controllers/upload.controller.js";

const uploadRouter = new Hono();

uploadRouter.post("/profile-photo", uploadProfilePhoto);
uploadRouter.get("/profile-photo/:userId", getProfilePhoto);
uploadRouter.delete("/profile-photo/:userId", deleteProfilePhoto);
uploadRouter.delete("/requirement-document/:userId/:requirementID", deleteRequirement);
uploadRouter.post("/requirement-document", uploadRequirementDocument);


export default uploadRouter;

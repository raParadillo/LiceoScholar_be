import { Hono } from "hono";
import {getRequirementsByUserID, updateRequirementStatus } from "../controllers/requirments.controller.js";

const requirementsRouter = new Hono();


requirementsRouter.get("/user/:userID", getRequirementsByUserID);
requirementsRouter.put("/user/:userID/:requirementID/:status", updateRequirementStatus);


export default requirementsRouter;

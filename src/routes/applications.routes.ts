import { Hono } from "hono";
import { getApplications, getApplicationsByStatus, getApplicationsByUserID, createApplication, rejectApplication, acceptApplication, semFinish, searchApplicationsByName } from "../controllers/applications.controller.js";


const applicationsRouter = new Hono();

applicationsRouter.get("/", getApplications);
applicationsRouter.get("/search/:name", searchApplicationsByName);
applicationsRouter.get("/status/:status", getApplicationsByStatus);
applicationsRouter.get("/user/:userID", getApplicationsByUserID);
applicationsRouter.post("/create", createApplication);
applicationsRouter.post("/reject/:ApplicationID", rejectApplication);
applicationsRouter.post("/approve/:ApplicationID", acceptApplication);
applicationsRouter.post("/semester-finish", semFinish);

export default applicationsRouter;

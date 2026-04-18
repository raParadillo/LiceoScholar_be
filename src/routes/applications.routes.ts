import { Hono } from "hono";
import { getApplications, getApplicationsByStatus, getApplicationsByUserID, createApplication, rejectApplication, acceptApplication, semFinish, searchApplicationsByName, ChangeToPending, getSySem, updateSySem } from "../controllers/applications.controller.js";


const applicationsRouter = new Hono();

applicationsRouter.get("/", getApplications);
applicationsRouter.get("/search/:name", searchApplicationsByName);
applicationsRouter.get("/status/:status", getApplicationsByStatus);
applicationsRouter.get("/user/:userID", getApplicationsByUserID);
applicationsRouter.get("/sy-sem", getSySem);
applicationsRouter.post("/create", createApplication);
applicationsRouter.put("/reject/:ApplicationID", rejectApplication);
applicationsRouter.put("/approve/:ApplicationID", acceptApplication);
applicationsRouter.put("/change-to-pending/:ApplicationID", ChangeToPending);
applicationsRouter.put("/semester-finish", semFinish);
applicationsRouter.put("/sy-sem", updateSySem);

export default applicationsRouter;

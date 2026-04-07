import { Hono } from 'hono'
import { getScholars, getDailyApplicationsStats, getUsersByCollege } from '../controllers/stats.controller.js';

const statsRoute = new Hono()

statsRoute.get("/scholars", getScholars);
statsRoute.get("/dailyApplications", getDailyApplicationsStats);
statsRoute.get("/usersByCollege", getUsersByCollege);

export default statsRoute;

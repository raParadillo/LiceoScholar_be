import { Hono } from 'hono';
import { getScholars } from '../controllers/stats.controller.js';
const statsRoute = new Hono();
statsRoute.get("/scholars", getScholars);
export default statsRoute;

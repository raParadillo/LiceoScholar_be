import 'dotenv/config';

import usersRoute from "./routes/users.routes.js";
import statsRoute from "./routes/stats.routes.js";
import applicationsRouter from "./routes/applications.routes.js";
import authRouter from "./routes/auth.routes.js";
import { serve } from '@hono/node-server'
import { Hono } from 'hono'


const app = new Hono()

app.get("/", (c) => {
  return c.json({ message: "Hello, Hono!" })
})

app.route("/stats", statsRoute);
app.route("/users", usersRoute);
app.route("/applications", applicationsRouter);
app.route("/auth", authRouter);

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

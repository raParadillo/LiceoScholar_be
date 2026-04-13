import 'dotenv/config';

import usersRoute from "./routes/users.routes.js";
import statsRoute from "./routes/stats.routes.js";
import applicationsRouter from "./routes/applications.routes.js";
import authRouter from "./routes/auth.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'


const app = new Hono()

app.use(cors({
  origin: 'http://localhost:4200',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));


app.get('/', (c) => {
  return c.text('Hello Hono!')
});


app.route("/stats", statsRoute);
app.route("/users", usersRoute);
app.route("/applications", applicationsRouter);
app.route("/auth", authRouter);
app.route("/upload", uploadRouter);

// Serve static files from uploads directory
app.use('/uploads/*', serveStatic({ root: './' }))

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

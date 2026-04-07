import usersRoute from "./routes/users.routes.js";
import statsRoute from "./routes/stats.routes.js";
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
const app = new Hono();
app.get("/hello/:id", (c) => {
    const id = c.req.param("id");
    return c.json({ message: `Hello, Hono! ID: ${id}` });
});
app.route("/stats", statsRoute);
app.route("/users", usersRoute);
serve({
    fetch: app.fetch,
    port: 3000
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});

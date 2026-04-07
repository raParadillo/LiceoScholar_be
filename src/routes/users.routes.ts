import { Hono } from 'hono'
import { getAllUsers, getUserById, createUser, updateUserById, deleteUserById, searchUserByName, getUserProfile } from '../controllers/users.controller.js';

const usersRoute = new Hono()

usersRoute.get("/", getAllUsers);
usersRoute.get("/search/:name", searchUserByName);
usersRoute.get("/:id", getUserById);
usersRoute.get("/profile/:id", getUserProfile);
usersRoute.post("/", createUser);
usersRoute.put("/:id", updateUserById);
usersRoute.delete("/:id", deleteUserById);

export default usersRoute;
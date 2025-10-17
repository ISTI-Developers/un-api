import express from "express";
import { UserController } from "../controller/users.controller";

const router = express.Router();

router.get("/test", UserController.test);

export const UserRoute = router;

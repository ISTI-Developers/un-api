import express from "express";
import { UserController } from "../controller/users.controller";

const router = express.Router();

router.get("/test", UserController.test);

router.get("/", UserController.getUsers);

router.get("/summary", UserController.getUsersSummary);

export const UserRoute = router;

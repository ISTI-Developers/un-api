import express from "express";
import { UnisController } from "../controller/unis.controller";

const router = express.Router();

router.get("/available", UnisController.getAvailableSites);

export const UnisRoute = router;

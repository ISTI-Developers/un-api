import express from "express";
import { UTASIController } from "../controller/utasi.controller";

const router = express.Router();

router.get("/test", UTASIController.test);

router.get("/contracts", UTASIController.getContracts);

export const UTASIRoute = router;

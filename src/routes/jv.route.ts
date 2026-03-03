import express from "express";
import { JVController } from "../controller/jv.controller";

const router = express.Router();

router.get("/test", JVController.test);

router.get("/expenses", JVController.getExpenses);

router.get("/revenue", JVController.getRevenue);

export const JVRoute = router;

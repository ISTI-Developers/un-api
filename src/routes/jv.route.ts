import express from "express";
import { JVController } from "../controller/jv.controller";

const router = express.Router();

router.get("/test", JVController.test);

router.get("/expenses", JVController.getExpenses);
router.get("/expenses/category", JVController.getExpensesCategory);

router.get("/revenue", JVController.getRevenue);
router.get("/revenue/category", JVController.getRevenueCategory);

export const JVRoute = router;

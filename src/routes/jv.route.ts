import express from "express";
import { JVController } from "../controller/jv.controller";
import { UnisController } from "../controller/unis.controller";

const router = express.Router();

router.get("/test", JVController.test);

router.get("/expenses", JVController.getExpenses);
router.get("/expenses/category", JVController.getExpensesCategory);

router.get("/revenue", JVController.getRevenue);
router.get("/revenue/category", JVController.getRevenueCategory);

router.get("/getRevenueOfJV", UnisController.getRevenueOfJV);
router.get("/getLocations", UnisController.getLocations);

export const JVRoute = router;

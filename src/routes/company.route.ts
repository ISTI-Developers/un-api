import express from "express";
import { CompanyController } from "../controller/company.controller";

const router = express.Router();

router.get("/test", CompanyController.test);

router.get("/companies", CompanyController.getCompanies);

router.get("/departments", CompanyController.getDepartments);

router.get("/units", CompanyController.getUnits);

export const CompanyRoute = router;

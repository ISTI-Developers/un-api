import express from "express";
import { UnisController } from "../controller/unis.controller";

const router = express.Router();

router.get("/available", UnisController.getAvailableSites);

router.get("/latest", UnisController.getLatestSites);

router.get("/images/:site", UnisController.getSiteImages);

router.get("/files", UnisController.getImageFile);

router.get("/files/:id", UnisController.getImageThumbnail);

router.get("/areas", UnisController.getAreas);

router.get("/rentals", UnisController.getSiteRentals);

export const UnisRoute = router;

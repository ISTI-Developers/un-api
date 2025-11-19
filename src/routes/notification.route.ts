// src/route/notification.route.ts
import express from "express";
import { NotificationController } from "../controller/notifications.controller";

const router = express.Router();

router.get("/public-key", NotificationController.getPublicKey);
router.post("/subscribe", NotificationController.subscribe);
router.post("/send", NotificationController.sendNotification);

export const NotificationRoute = router;

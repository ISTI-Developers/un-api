// src/route/notification.route.ts
import express from "express";
import { NotificationController } from "../controller/notifications.controller";

const router = express.Router();

router.get("/", NotificationController.getNotifications);
router.get("/public-key", NotificationController.getPublicKey);
router.post("/subscribe", NotificationController.subscribe);
router.post("/send", NotificationController.sendNotification);
router.post("/save", NotificationController.saveNotification);
router.post("/read", NotificationController.readNotification);

export const NotificationRoute = router;

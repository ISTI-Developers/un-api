// src/controller/notification.controller.ts
import { Request, Response } from "express";
import webpush from "web-push";
import { MySQL } from "../config/db";
import { send } from "../utils/helper";
import { ResultSetHeader } from "mysql2";

webpush.setVapidDetails(
  "mailto: <vncntkyl.developer@gmail.com>",
  "BKS60bJGvZ0A6SfgI_O1wrR9X29hf1sr8q0bynLrDoWVUt6ALDiMsdn4cWjZLjnqlMtGSDlM-so5eO2PAcQcjHM",
  "uKR1s6yEPcq0gpsmRvKlgTYyFY71NBBHdsOX48CWpPk"
);

interface Subscription extends ResultSetHeader {
  endpoint: string;
  expirationTime: null;
  p256dh: string;
  auth: string;
}
const db = new MySQL();

export const NotificationController = {
  async getPublicKey(req: Request, res: Response) {
    res.status(200).send(process.env.VAPID_PUBLIC_KEY);
  },

  async subscribe(req: Request, res: Response) {
    const data = req.body;

    const { subscription, user_id, platform } = data;
    const { endpoint, keys } = JSON.parse(subscription);

    await db.query(
      "INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_id, platform) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE endpoint = endpoint",
      [endpoint, keys.p256dh, keys.auth, user_id, platform]
    );
    send(res).ok("Subscribed!");
  },

  async sendNotification(req: Request, res: Response) {
    const body = req.body;

    const { recipients, ...payload } = body;

    let query = "SELECT * FROM push_subscriptions";
    let params = [];

    if (recipients !== "ALL") {
      query =
        query +
        ` WHERE user_id IN (${Array(recipients.length).fill("?").join(", ")})`;
      params = recipients;
    }
    const subscriptions = await db.query<Subscription>(query, params);
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth,
              p256dh: sub.p256dh,
            },
          },
          JSON.stringify(payload)
        )
      )
    );

    console.log(results);

    res.status(200).json({ acknowledged: true, results });
  },
};

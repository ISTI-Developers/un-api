import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import * as fs from "fs";
import * as https from "https";
import { CONFIG } from "./config/config";
import { UserRoute } from "./routes/users.route";
import { UnisRoute } from "./routes/unis.route";
const app = express();

const PORT = CONFIG.PORT || 8001;

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(express.text());
app.use(express.json());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use("/users", UserRoute);
app.use("/unis", UnisRoute);

app.get("/", (_, res) => {
  res.send({ message: "UNMG Workplace API is now live." }).status(200);
});

if (CONFIG.NODE_ENV === "production") {
  const privateKey = fs.readFileSync(
    "/etc/letsencrypt/live/ooh.unmg.com.ph/privkey.pem",
    "utf8"
  );
  const certificate = fs.readFileSync(
    "/etc/letsencrypt/live/ooh.unmg.com.ph/cert.pem",
    "utf8"
  );
  const ca = fs.readFileSync(
    "/etc/letsencrypt/live/ooh.unmg.com.ph/chain.pem",
    "utf8"
  );

  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca,
  };
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(CONFIG.PORT, () => {
    console.log(
      `Running ${CONFIG.NODE_ENV} listening at ${CONFIG.SERVER}:${PORT}`
    );
  });
} else {
  app.listen(PORT, () => {
    console.log(
      `Running ${CONFIG.NODE_ENV} listening at ${CONFIG.SERVER}:${PORT}`
    );
  });
}

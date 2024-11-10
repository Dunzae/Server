import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs"
import cors from "cors";
import https from "https"
import instagramRouter from "./routes/instagram/main"

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
const app = express();
const { PORT, MONGO_URI } = process.env;
const options = {
  key : fs.readFileSync("./selfsigned.key"),
  cert : fs.readFileSync("./selfsigned.crt"),
}

app.use(cors());
app.use(express.json());
app.use(express.static("files"));
app.use(express.urlencoded({ extended: true }));

app.use("/instagram", instagramRouter);
const server = https.createServer(options, app);

async function main() {
  try {
    await mongoose.connect(MONGO_URI as string, { serverApi: { version: "1", strict: true, deprecationErrors: true }, dbName : "portfolio" });
    server.listen(PORT, () => {

      console.log(
        `[Server] : Server is running at 0.0.0.0:${PORT}`
      );
    });
  } catch (e) {
    console.error(e);
  }
}

main();
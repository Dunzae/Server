import express from "express";
import commentRouter from "./comment";
import postRouter from "./post";
import userRouter from "./user";
import checkMiddleware from "@middlewares/instagram/check"

const router = express.Router();
router.use("/comment", checkMiddleware, commentRouter);
router.use("/post", checkMiddleware, postRouter);
router.use("/user", userRouter);

export default router;
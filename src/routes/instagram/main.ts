import express from "express";
import commentRouter from "./comment";
import postRouter from "./post";
import userRouter from "./user";

const router = express.Router();
router.use("/comment", commentRouter);
router.use("/post", postRouter);
router.use("/user", userRouter);

export default router;
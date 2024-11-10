import express from "express";
import mongoose from "mongoose";
import CommentSchema from "@models/instagram/comment";

const router = express.Router();

/* 댓글 생성 api
 * @http POST
 * @body id String 댓글의 주체의 오브젝트 아이디
 * @body body String 댓글의 내용
 * @status
 * - [200] 성공
 * - [400] There are no bodies (id나 body가 비어있는 경우)
 * - [500] Unknown error (알 수 없는 오류가 발생 했을 경우)
 */

interface ICreateBody {
	id: string;
	body: string;
}

router.post("/", async (req, res) => {
	const { id, body }: ICreateBody = req.body;

	if (id === undefined || body === undefined) {
		res.status(400).send({
			message: "There are no bodies",
		});
		return;
	}

	try {
		const commentModel = mongoose.model("comment", CommentSchema);

		await new commentModel({
			author: req.user.id,
			parent: id,
			body,
		}).save();
		res.sendStatus(200);
	} catch (e) {
		console.log(e);
		res.status(500).send({
			message: "Unknown error",
		});
	}
});

/*
 * 좋아요 수정 api
 * @method GET
 * @query id string
 * @status
 * - [400] The query does not exist.
 * - [500] Unknown error
 */
interface ICommentEditQuery {
	id?: string;
}

router.get("/like", async (req, res) => {
	const { id }: ICommentEditQuery = req.query;

	if (id === undefined) {
		res.status(400).send({ message: "The query does not exist" });
		return;
	}

	try {
		const CommentModel = mongoose.model("comment", CommentSchema);

		const commentDoc = await CommentModel.findById(id);

		if (commentDoc === null) {
			res.status(400).send({ message: "There is no comment" });
			return;
		}

		const isPressedLike =
			commentDoc.likePeople.findIndex(
				(person) => person.toString() === req.user.id
			) > -1;
		if (isPressedLike) {
			commentDoc.likeCount -= 1;
			commentDoc.likePeople = commentDoc.likePeople.filter(
				(person) => person.toString() !== req.user.id
			);
		} else {
			commentDoc.likeCount += 1;
			commentDoc.likePeople = [...commentDoc.likePeople, req.user.id];
		}

		await commentDoc.save();
		res.sendStatus(200);
	} catch (e) {
		res.status(500).send({ message: "Unknown error" });
	}
});

export default router;

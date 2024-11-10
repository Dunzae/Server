import express, { Request, Response, NextFunction } from "express";
import mongoose, { Error } from "mongoose";
import multer, { MulterError } from "multer";
import PostSchema from "@models/instagram/post";
import CommentSchema from "@models/instagram/comment";
import UserSchema from "@models/instagram/user";
import removeFiles from "@utils/instagram/removeFile";

const router = express.Router();

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
		const PostModel = mongoose.model("post", PostSchema);

		const postDoc = await PostModel.findOne({
			_id: id,
		});
		if (postDoc === null) {
			res.status(400).send({ message: "There is no post" });
			return;
		}

		const isPressedLike =
			postDoc.likePeople.findIndex(
				(person) => person.toString() === req.user.id
			) > -1;
		if (isPressedLike) {
			postDoc.likeCount -= 1;
			postDoc.likePeople = postDoc.likePeople.filter(
				(person) => person.toString() !== req.user.id
			);
		} else {
			postDoc.likeCount += 1;
			postDoc.likePeople = [...postDoc.likePeople, req.user.id];
		}

		await postDoc.save();
		res.send({
			post: postDoc
		})
	} catch (e) {
		res.status(500).send({ message: "Unknown error" });
	}
});

/*
 * 다중 포스트 조회 api
 * @http GET
 * @query max number
 * @query count number
 * @status
 * - [200] {length} 가져온 포스트 갯수
 * - [400] There are not queries ( max나 count가 비어있을 경우 )
 * - [400] There are no posts. ( 포스트를 더 이상 반환할 수 없을 때 )
 * - [500] Unknown error (알 수 없는 오류가 발생했을 때)
 *
 */

interface IPostQuery {
	max?: number;
	count?: number;
}

type ReturnType = {
	id: string;
	author: string;
	caption: string;
	contents?: string[];
	pressLike: boolean;
	likeCount: number;
	commentCount: number;
}[];

router.get("/", async (req, res) => {
	const { count, max }: IPostQuery = req.query;

	if (count === undefined || max === undefined) {
		res.status(400).send({ message: "There are not queries" });
		return;
	}

	try {
		const PostModel = mongoose.model("post", PostSchema);
		const UserModel = mongoose.model("user", UserSchema);
		const CommentModel = mongoose.model("comment", CommentSchema);

		const posts = await PostModel.find()
			.sort({ like: -1, createDate: 1 })
			.skip(count * max)
			.limit(max);

		if (posts === undefined || posts.length === 0) {
			res.status(400).send({ message: "There are no posts" });
			return;
		}

		let result: ReturnType = [];
		for (let i = 0; i < posts.length; i++) {
			const userDoc = await UserModel.findById(posts[i].author);
			const commentDoc = await CommentModel.find({
				parent: posts[i]._id,
			});

			result.push({
				id: posts[i].id,
				author: userDoc?.nickName ?? "탈퇴한 사용자",
				caption: posts[i].caption,
				contents: posts[i].contents,
				pressLike:
					posts[i].likePeople.findIndex(
						(person) => person.toString() === req.user.id
					) > -1,
				likeCount: posts[i].likeCount,
				commentCount: commentDoc.length,
			});
		}

		res.send({ posts: result });
	} catch (e) {
		res.status(500).send({ message: "Unknown error" });
	}
});

/*
 * 단일 포스트 조회 api
 * @http GET
 * @params id String 포스트의 아이디
 * @status
 * - [200] 성공
 * - [400] There is no id (id 값이 비었을 때)
 * - [400] There is no post (가져올 포스트가 없을 때)
 * - [500] Unknown error (알 수 없는 오류가 발생했을 때)
 */
router.get("/:id", async (req, res) => {
	const { id } = req.params;

	if (id === undefined) {
		res.status(400).send({
			message: "There is no id",
		});
		return;
	}

	const PostModel = mongoose.model("post", PostSchema);
	const post = await PostModel.findById(id);

	if (post === null || post === undefined) {
		res.status(400).send({ message: "There is no post" });
		return;
	}

	const UserModel = mongoose.model("user", UserSchema);
	const CommentModel = mongoose.model("comment", CommentSchema);
	const comments = await CommentModel.find({
		parent: id,
	});

	const userDoc = await UserModel.findById(post.author);
	let commentArray = [];
	for (let i = 0; i < comments.length; i++) {
		const commentUserDoc = await UserModel.findById(comments[i].author);
		commentArray.push({
			id: comments[i].id,
			author: commentUserDoc?.nickName ?? "탈퇴한 사용자",
			body: comments[i].body,
			likeCount: comments[i].likeCount,
			pressLike:
				comments[i].likePeople.findIndex(
					(person) => person.toString() === req.user.id
				) > -1,
			modificationDate: comments[i].modificationDate,
		});
	}

	res.send({
		id,
		caption: post.caption,
		author: userDoc?.nickName ?? "탈퇴한 사용자",
		contents: post.contents,
		likeCount: post.likeCount,
		pressLike:
			post.likePeople.findIndex(
				(person) => person.toString() === req.user.id
			) > -1,
		commentCount: commentArray.length,
		comments: commentArray,
		createDate: post.createDate,
	});
});

/*
 * 포스트 업로드 api
 * @http POST
 * @body caption String
 * @files imageList Express.Request.files
 * status
 * - [200]
 * - [400] There are no caption or files (캡션이나 파일이 존재하지 않습니다.)
 * - [400] Caption is longer than 2200 (caption의 길이 제한을 넘었을 경우)
 * - [400] There are too many files (파일의 갯수는 12개로 제한합니다.)
 * - [400] There are too many videos (비디오는 하나만 업로드 가능합니다)
 * - [500] Unknown Error ( 알 수 없는 오류가 발생했을 경우)
 */

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const ext = file.mimetype.split("/")[1];

		if (["mp4", "avi"].includes(ext)) {
			return cb(null, "files/videos");
		}

		if (["png", "jpg", "jpeg"].includes(ext)) {
			return cb(null, "files/images");
		}
	},
	filename: function (req, file, cb) {
		const ext = file.mimetype.split("/")[1];

		const uniqueSuffix =
			(Date.now() + Math.round(Math.random() * 1e9)).toString() +
			"." +
			ext;
		cb(null, uniqueSuffix);
	},
});

const upload = multer({ storage });

function uploadErrorMiddleware(
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction
) {
	if (err instanceof MulterError) {
		const multerError = err as MulterError;
		console.log(multerError);
		if (multerError.code === "LIMIT_UNEXPECTED_FILE") {
			res
				.status(400)
				.send({ message: "There are too many files" });
				return;
		}
	}

	console.error(err);
	res.status(500).send({ message: "Unknown error" });
	return;
}

interface IPostUploadBody {
	caption: string;
}

router.post(
	"/",
	upload.array("files", 12),
	async (req: Request, res: Response) => {
		const { caption }: IPostUploadBody = req.body;
		const files = req.files as Express.Multer.File[];
		const filePathArray = files.map((file) => file.path);

		if (
			caption === undefined ||
			files === undefined ||
			files.length === 0
		) {
			removeFiles(filePathArray);
			res
				.status(400)
				.send({ message: "There are no caption or files" });
			return;
		}

		if (caption.length > 2200) {
			removeFiles(filePathArray);
			res
				.status(400)
				.send({ message: "Caption is longer than 2200" });
			return;
		}

		let video = 0;
		const fileNameArray = files.map((file) => {
			const ext = file.mimetype.split("/")[1];
			let type = "images";
			if (["mp4", "avi"].includes(ext)) {
				type = "videos";
				video += 1;
			}

			return `/${type}/${file.filename}`;
		});

		if (video > 1) {
			removeFiles(filePathArray);
			res
				.status(400)
				.send({ message: "There are too many videos" });
			return;
		}

		try {
			const PostModel = mongoose.model("post", PostSchema);

			await new PostModel({
				author: req.user.id,
				caption,
				contents: fileNameArray,
			}).save();

			res.sendStatus(200);
			return;
		} catch (error) {
			console.log(error);
			res.status(500).send({
				message: "Unknown error",
			});
			return;
		}
	},
	uploadErrorMiddleware
);

export default router;

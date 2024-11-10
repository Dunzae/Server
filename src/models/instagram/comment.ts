import { Schema } from "mongoose";

interface ICommentSchema {
	_id: Schema.Types.ObjectId;
	author: Schema.Types.ObjectId;
	parent: Schema.Types.ObjectId;
	body: string;
	likeCount: number;
	likePeople: Schema.Types.ObjectId[];
	createDate: Date;
	modificationDate: Date;
}

const CommentSchema = new Schema<ICommentSchema>({
	author: {
		type: Schema.Types.ObjectId,
		required: true,
	},
	parent: {
		type: Schema.Types.ObjectId,
		required: true,
	},
	body: {
		type: String,
		default: "",
	},
	likeCount: {
		type: Number,
		default: 0,
	},
	likePeople: {
		type: [Schema.Types.ObjectId],
		default: [],
	},
	createDate: {
		type: Date,
		default: Date.now,
	},
	modificationDate: {
		type: Date,
		default: Date.now,
	},
});

export default CommentSchema;

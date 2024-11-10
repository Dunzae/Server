import { Schema } from "mongoose";

interface IPostSchema {
	_id: Schema.Types.ObjectId;
	author: Schema.Types.ObjectId;
	caption: string;
	contents?: string[];
	likeCount: number;
	likePeople: Schema.Types.ObjectId[];
	createDate: Date;
}

const PostSchema = new Schema<IPostSchema>({
	author: {
		type: Schema.Types.ObjectId,
		required: true,
	},
	caption: {
		type: String,
	},
	contents: {
		type: [String],
		default: [],
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
});

export default PostSchema;

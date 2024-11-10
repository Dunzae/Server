import mongoose from "mongoose";

interface IUserSchema {
	phone?: string;
	email?: string;
	fullName: string;
	nickName: string;
	password: string;
	photo: string;
	follower: number;
	following: number;
	createDate: Date;
}

const UserSchema = new mongoose.Schema<IUserSchema>({
	phone: {
		type: String,
		unique: true,
		sparse: true,
	},
	email: {
		type: String,
		unique: true,
		sparse: true,
	},
	fullName: {
		type: String,
		require: true,
	},
	nickName: {
		type: String,
		index: true,
		unique: true,
		require: true,
	},
	password: {
		type: String,
		require: true,
	},
	photo: {
		type: String,
		default: "http://localhost:4000/images/defaultProfileImage.jpg",
	},
	follower: {
		type: Number,
		default: 0,
	},
	following: {
		type: Number,
		default: 0,
	},
	createDate: {
		type: Date,
		default: Date.now,
	},
});

export default UserSchema;

import express from "express";
import mongoose from "mongoose";
import { generateToken, validateToken } from "@utils/instagram/jwt";
import UserSchema from "@models/instagram/user";
import { JsonWebTokenError } from "jsonwebtoken";

const router = express.Router();

/* 로그인 API
 * @http POST
 * @body id string
 * @body password string
 * @status
 * - 200
 *  {
 *   accessToken string
 *   refreshToken string
 *  }
 * - 400 Inputs are invalid (입력값이 비었거나 유효하지 않은 경우)
 * - 401 User does not exist (사용자가 존재하지 않을 경우)
 * - 401 Password is not correct (비밀번호가 틀린 경우)
 * - 500 Unknown error ( 알 수 없는 서버 오류 혹은 데이터베이스 오류)
 */
interface ISignInBody {
	id: string;
	password: string;
}

router.post("/signIn", async (req, res) => {
	const { id, password }: ISignInBody = req.body;

	if (id === undefined || password === undefined) {
		res.status(400).send({
			message: "Inputs are invalid",
		});
		return;
	}

	let idType = "";
	const emailRegExp = /[^@]+@.+/;
	const phoneRegExp = /01[0-9]{9}/;

	if (emailRegExp.test(id)) {
		idType = "email";
	} else if (phoneRegExp.test(id)) {
		idType = "phone";
	} else {
		idType = "nickName";
	}

	const userModel = mongoose.model("user", UserSchema);
	const userDoc = await userModel.findOne({
		[idType]: id,
	});

	if (userDoc === null) {
		res.status(401).send({
			message: "User does not exist",
		});
		return;
	}

	if (userDoc.password !== password) {
		res.status(401).send({
			message: "Password is not correct",
		});
		return;
	}


	res.send({
		accessToken: generateToken("accessToken", {
			id: userDoc.id,
			nickName: userDoc.nickName,
			fullName: userDoc.fullName,
		}),
		refreshToken: generateToken("refreshToken"),
	});
});

/* 회원가입 API
 * @http POST
 * @body phoneOrEmail string
 * @body fullName string
 * @body nickName string
 * @body password string
 * @status
 * - 200 {
 *  		accessToken String
 * 		refreshToken String
 *  }
 * - 400 Inputs are invalid (입력값이 비었거나 유효하지 않은 경우)
 * - 401 Email already exists (이메일이 이미 존재하는 경우)
 * - 401 Phone already exists (휴대폰이 이미 존재하는 경우)
 * - 401 Nickname already exists (닉네임이 이미 존재하는 경우)
 * - 500 Unknown Error (알 수 없는 서버 혹은 데이터베이스 오류)
 */

interface ISignUpBody {
	phoneOrEmail: string;
	fullName: string;
	nickName: string;
	password: string;
}

router.post("/signUp", async (req, res) => {
	const { phoneOrEmail, fullName, nickName, password }: ISignUpBody =
		req.body;

	if (
		phoneOrEmail === undefined ||
		fullName === undefined ||
		nickName === undefined ||
		password === undefined
	) {
		res.status(400).send({
			message: "Inputs are invalid",
		});
		return;
	}

	let phoneOrEmailType: undefined | "phone" | "email" = undefined;
	const emailRegExp = /[^@]+@.+/;
	const phoneRegExp = /01[0-9]{9}/;
	if (emailRegExp.test(phoneOrEmail)) {
		phoneOrEmailType = "email";
	} else if (phoneRegExp.test(phoneOrEmail)) {
		phoneOrEmailType = "phone";
	} else {
		res.status(400).send({
			message: "Inputs are invalid",
		});
		return;
	}

	const userModel = mongoose.model("User", UserSchema);
	const doc = await userModel
		.findOne({
			$or: [{ [phoneOrEmailType]: phoneOrEmail }, { nickName }],
		})
		.select({ [phoneOrEmailType]: 1 })
		.lean();

	if (doc !== null) {
		if (doc[phoneOrEmailType] === phoneOrEmail) {
			res.status(401).send({
				message: `${phoneOrEmailType[0].toUpperCase()}${phoneOrEmailType.slice(1)} already exists`,
			});
			return;
		}
		else {
			res.status(401).send({ message: "Nickname already exists" });
			return;
		}
	}

	const userDoc = await new userModel({
		[phoneOrEmailType]: phoneOrEmail,
		fullName,
		nickName,
		password,
	}).save();

	res.send({
		accessToken: generateToken("accessToken", {
			id: userDoc.id,
			nickName: userDoc.nickName,
			fullName: userDoc.fullName,
			photo: userDoc.photo,
		}),
		refreshToken: generateToken("refreshToken"),
	});
});

/* 인증 확인 API
 * @http POST
 * @body accessToken string
 * @body refreshToken string
 * @status
 * - 200 { accessToken }
 * - 400 AccessToken is required (엑세스 토큰이 비었을 경우)
 * - 400 RefreshToken is required (리프레쉬 토큰이 비었을 경우)
 * - 401 RefreshToken has expired (리프레쉬 토큰의 유효기간이 지났을 경우)
 * - 500 Unknown error (알 수 없는 오류가 발생했을 경우)
 */
interface ICheckBody {
	accessToken: string;
	refreshToken: string;
}

router.post("/check", async (req, res) => {
	const { accessToken, refreshToken }: ICheckBody = req.body;

	if (accessToken === undefined) {
		res.status(400).send({
			message: "AccessToken is required",
		});
		return;
	}

	try {
		const decodedAccessToken = await validateToken(accessToken);
		if (!decodedAccessToken.isExpired) {
			 res.send({ accessToken });
			 return;
		}

		const decodedRefreshToken = await validateToken(refreshToken);
		if (decodedRefreshToken.isExpired) {
			res
				.status(401)
				.send({ message: "RefreshToken has expired" });
			return;
		}
		res.send({
			accessToken: generateToken("accessToken", decodedAccessToken.token),
		});
	} catch (error) {
		res.status(500).send({
			message: "Unknown Error",
		});
	}
});

export default router;

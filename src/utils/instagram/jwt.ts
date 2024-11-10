import { JsonWebTokenError, JwtPayload, sign, verify } from "jsonwebtoken";
import fs from "fs";
import path from "path";

type PayloadType = string | JwtPayload | undefined;

export function generateToken(type: string, payload: PayloadType = {}) {
	const expiresIn = type === "accessToken" ? "1h" : "1d";
	const privateKey = fs.readFileSync(
		path.join(process.cwd(), "/private.key")
	);

	return sign(
		payload,
		{
			key: privateKey,
			passphrase: process.env.PASS_PHRASE as string,
		},
		{
			algorithm: "RS256",
			expiresIn,
		}
	);
}

export type validateTokenReturnType = {
	isExpired: boolean;
	token: string | JwtPayload | undefined;
};

export function validateToken(token: string): Promise<validateTokenReturnType> {
	const publicKey = fs.readFileSync(path.join(process.cwd(), "/public.key"));

	return new Promise((resolve, reject) => {
		verify(
			token,
			publicKey,
			{
				algorithms: ["RS256"],
			},
			(error, decoded) => {
				if (error !== null && error.name === "TokenExpiredError") {
					return resolve({
						isExpired: true,
						token: decoded,
					});
				}

				if (error) return reject(error);
				return resolve({
					isExpired: false,
					token: decoded,
				});
			}
		);
	});
}

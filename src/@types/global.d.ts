declare global {
	namespace Express {
		interface Request {
			user: import("../../node_modules/@types/jsonwebtoken/index").JwtPayload;
		}
	}
}

export {};

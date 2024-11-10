import { Request, Response, NextFunction } from "express"
import errors from "../utils/error";
import { verifyJwtToken } from "../utils/jwt";

export default (req: Request, res: Response, next: NextFunction) => {
    const { TokenIsRequired, TokenIsInvalid } = errors;
    const jwt = req.headers.authorization?.split("Bearer ")[1];

    if (jwt === undefined) {
        res.status(400).json({ error: TokenIsRequired })
        return;
    }

    try {
        const payload = verifyJwtToken(jwt);
        req.user = payload;
        next();
    } catch (e) {
        res.status(401).json({ error: TokenIsRequired })
        return;
    }
}
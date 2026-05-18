import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import debatesRouter from "./debates";
import argumentsRouter from "./arguments";
import usersRouter from "./users";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(debatesRouter);
router.use(argumentsRouter);
router.use(usersRouter);
router.use(analyticsRouter);

export default router;

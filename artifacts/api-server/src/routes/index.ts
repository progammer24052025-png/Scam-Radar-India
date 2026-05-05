import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import reportsRouter from "./reports.js";
import tokensRouter from "./tokens.js";
import alertsRouter from "./alerts.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(reportsRouter);
router.use(tokensRouter);
router.use(alertsRouter);
router.use(adminRouter);

export default router;

import { Router } from "express";
import promptRoutes from "./prompt";
import healthcheckRoutes from "./healthcheck";

const router = Router();

router.use("/api", promptRoutes);
router.use("/api", healthcheckRoutes);

export default router;

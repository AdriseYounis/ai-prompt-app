import { Router } from "express";
import promptRoutes from "./prompt";
import healthcheckRoutes from "./healthcheck";
import smartSearchRoutes from "./smartSearch";

const router = Router();

router.use("/api", promptRoutes);
router.use("/api", healthcheckRoutes);
router.use("/api", smartSearchRoutes);

export default router;

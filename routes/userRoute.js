import express from "express";

import { loadIndex } from "../controllers/userController.js";

const router = express();

router.get('/', loadIndex);

export default router;
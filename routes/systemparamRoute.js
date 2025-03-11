import express from "express";
import * as systemparamC from '../controllers/systemparamController.js';

const router = express.Router()

router.get('/systemparam', systemparamC.getSystemParam)

export default router
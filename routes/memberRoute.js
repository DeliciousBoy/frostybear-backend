// member route
import express from 'express';
import * as memberC from "../controllers/memberController.js";

const router = express.Router();

router.post('/register', memberC.createMember);
router.post('/login', memberC.loginMember);
router.get('/logout', memberC.logoutMember);
router.post('/update', memberC.updateMember);
router.put('/putusername/:id', memberC.putusername);
router.put('/putpassword/:id',memberC.putpassword);

export default router;
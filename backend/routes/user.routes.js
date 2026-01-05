import { Router } from "express";

const router = Router();
import { register, login, logout, getProfile, forgotPassword, resetPassword, changePassword, updateUser, updateUserProgress, getCourseProgress, generateCertificate, getMyCourses, updateQuizScore } from '../controllers/user.controller.js';
import { isLoggedIn } from "../middleware/auth.middleware.js";
import upload from '../middleware/multer.middleware.js'

router.post('/register', upload.single("avatar"), register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', isLoggedIn, getProfile);
router.get('/my-courses', isLoggedIn, getMyCourses);
router.post('/reset', forgotPassword);
router.post('/reset/:resetToken', resetPassword);
router.post('/change-password', isLoggedIn, changePassword);
router.post('/update/:id', isLoggedIn, upload.single("avatar"), updateUser);

router.route('/progress')
    .post(isLoggedIn, updateUserProgress)
    .get(isLoggedIn, getCourseProgress);

router.post('/progress/quiz', isLoggedIn, updateQuizScore);

router.get('/certificate/:courseId', isLoggedIn, generateCertificate);

export default router;
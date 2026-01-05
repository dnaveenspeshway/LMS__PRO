import { Router } from "express";
const router = Router();
import { getAllCourses, getLecturesByCourseId, createCourse, updateCourse, removeCourse, addLectureToCourseById, deleteCourseLecture, updateCourseLecture, getVideoDuration, addQuizToCourse, getEnrolledStudents, addQuizToLecture, deleteQuizFromCourse, updateQuizInCourse, deleteQuizFromLecture, updateQuizInLecture } from '../controllers/course.controller.js'
import { isLoggedIn, authorisedRoles, authorizeSubscriber } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

router.route('/')
    .get(getAllCourses)
    .post(isLoggedIn, authorisedRoles('ADMIN'), upload.single("thumbnail"), createCourse)
    .delete(isLoggedIn, authorisedRoles('ADMIN'), deleteCourseLecture)
    .put(isLoggedIn, authorisedRoles('ADMIN'), upload.single("lecture"), updateCourseLecture)

router.route('/get-video-duration')
    .post(isLoggedIn, authorisedRoles('ADMIN'), getVideoDuration);

router.route('/:id/quiz')
    .post(isLoggedIn, authorisedRoles("ADMIN"), addQuizToCourse);

router.route('/:courseId/quiz/:quizId')
    .delete(isLoggedIn, authorisedRoles("ADMIN"), deleteQuizFromCourse)
    .put(isLoggedIn, authorisedRoles("ADMIN"), updateQuizInCourse);

router.route('/:courseId/lectures/:lectureId/quiz')
    .post(isLoggedIn, authorisedRoles("ADMIN"), addQuizToLecture);

router.route('/:courseId/lectures/:lectureId/quiz/:quizId')
    .delete(isLoggedIn, authorisedRoles("ADMIN"), deleteQuizFromLecture)
    .put(isLoggedIn, authorisedRoles("ADMIN"), updateQuizInLecture);

router.route('/:id/students')
    .get(isLoggedIn, authorisedRoles("ADMIN"), getEnrolledStudents);

router.route('/:id')
    .get(isLoggedIn, getLecturesByCourseId)
    .put(isLoggedIn, authorisedRoles("ADMIN"), upload.single("thumbnail"), updateCourse)
    .delete(isLoggedIn, authorisedRoles('ADMIN'), removeCourse)
    .post(isLoggedIn, authorisedRoles("ADMIN"), upload.single("lecture"), addLectureToCourseById);

export default router
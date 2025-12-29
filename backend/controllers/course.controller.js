import courseModel from '../models/course.model.js'
import userModel from '../models/user.model.js'
import quizModel from '../models/quiz.model.js'
import progressModel from '../models/progress.model.js'
import certificateModel from '../models/certificate.model.js'
import AppError from '../utils/error.utils.js';
import cloudinary from 'cloudinary';
import fs from 'fs';
import { videoDuration } from "@numairawan/video-duration";
import axios from 'axios';
import { google } from 'googleapis';
import PDFDocument from 'pdfkit';
import path from 'path';

// Helper function to convert ISO 8601 duration to a readable format
const convertIsoToDuration = (isoDuration) => {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = isoDuration.match(regex);

    if (!matches) {
        return '';
    }

    const hours = parseInt(matches[1] || '0', 10);
    const minutes = parseInt(matches[2] || '0', 10);
    const seconds = parseInt(matches[3] || '0', 10);

    let formattedDuration = '';
    if (hours > 0) {
        formattedDuration += `${hours}h `;
    }
    if (minutes > 0 || hours > 0) { // Show minutes if there are hours or minutes
        formattedDuration += `${minutes}m `;
    }
    formattedDuration += `${seconds}s`;

    return formattedDuration.trim();
};

// Helper function to convert milliseconds to a readable duration format (e.g., "1h 2m 3s")
const convertMillisToDuration = (millis) => {
    if (isNaN(millis) || millis < 0) {
        return '';
    }

    const totalSeconds = Math.floor(millis / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let formattedDuration = '';
    if (hours > 0) {
        formattedDuration += `${hours}h `;
    }
    if (minutes > 0 || hours > 0) { // Show minutes if there are hours or minutes
        formattedDuration += `${minutes}m `;
    }
    formattedDuration += `${seconds}s`;

    return formattedDuration.trim();
};

// get all courses
const getAllCourses = async (req, res, next) => {
    try {
        const courses = await courseModel.find({}).select('-lectures');

        res.status(200).json({
            success: true,
            message: 'All courses',
            courses
        })
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

// get specific course
const getLecturesByCourseId = async (req, res, next) => {
    try {
        const { id } = req.params;

        const course = await courseModel.findById(id);
        if (!course) {
            return next(new AppError('course not found', 500));
        }

        // Check enrollment if user is not admin
        if (req.user.role !== 'ADMIN') {
            const user = await userModel.findById(req.user.id);
            const isEnrolled = user.courseProgress.some(
                (cp) => cp.courseId.toString() === id
            );

            if (!isEnrolled) {
                // Return course without lectures if not enrolled
                course.lectures = [];
                return res.status(200).json({
                    success: true,
                    message: 'Course fetched (lectures hidden)',
                    course
                });
                // Alternatively, return 403:
                // return next(new AppError('You are not enrolled in this course', 403));
                // But the frontend might use this endpoint to get course details too?
                // Looking at frontend: DisplayLecture calls getCourseLectures(state._id).
                // CourseDescription passes state (course data) from the list.
                // So getLecturesByCourseId is likely used specifically for watching lectures.
                // Let's restrict it.
            }
        }

        res.status(200).json({
            success: true,
            message: 'course',
            course
        })
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

// create course
const createCourse = async (req, res, next) => {
    try {
        console.log("createCourse req.body:", req.body);
        const { title, description, category, createdBy, price } = req.body;

        if (!title || !description || !category || !createdBy || !price) {
            const missing = [];
            if (!title) missing.push('title');
            if (!description) missing.push('description');
            if (!category) missing.push('category');
            if (!createdBy) missing.push('createdBy');
            if (!price) missing.push('price');
            return next(new AppError(`All fields are required. Missing: ${missing.join(', ')}`, 400));
        }

        const course = await courseModel.create({
            title,
            description,
            category,
            createdBy,
            price
        })

        if (!course) {
            return next(new AppError('Course could not created, please try again', 500));
        }

        // file upload
        if (req.file) {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'Learning-Management-System'
            })

            if (result) {
                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_url = result.secure_url;
            }

            fs.rmSync(`uploads/${req.file.filename}`);
        }

        await course.save();

        // Sync with Quiz Entity
        const existingQuiz = await quizModel.findOne({ course: id });
        if (existingQuiz) {
            existingQuiz.questions = course.quizzes.map(q => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer
            }));
            await existingQuiz.save();
        } else {
            await quizModel.create({
                course: id,
                questions: course.quizzes.map(q => ({
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer
                }))
            });
        }

        res.status(200).json({
            success: true,
            message: 'Course successfully created',
            course
        })

    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

// update course
const updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await courseModel.findByIdAndUpdate(
            id,
            {
                $set: req.body
            },
            {
                runValidators: true
            }
        )

        if (!course) {
            return next(new AppError('Course with given id does not exist', 500));
        }

        if (req.file) {
            await cloudinary.v2.uploader.destroy(course.thumbnail.public_id);

            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'Learning-Management-System'
            })

            if (result) {
                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_url = result.secure_url;

                // Remove file from server
                fs.rmSync(`uploads/${req.file.filename}`);

            }

        }

        await course.save();

        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            course
        })
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

// remove course
const removeCourse = async (req, res, next) => {
    try {
        const { id } = req.params;

        const course = await courseModel.findById(id);

        if (!course) {
            return next(new AppError('Course with given id does not exist', 500));
        }

        await courseModel.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'course deleted successfully'
        })

    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

// add lecture to course by id
const addLectureToCourseById = async (req, res, next) => {
    try {
const { title, description, videoUrl, duration } = req.body;
        const { id } = req.params;

        if (!title || !description || (!req.file && !videoUrl)) {
            return next(new AppError('All fields are required, and either a video file or a video URL must be provided.', 400));
        }

        if (req.file && videoUrl) {
            return next(new AppError('Please provide either a video file or a video URL, not both.', 400));
        }

        const course = await courseModel.findById(id);

        if (!course) {
            return next(new AppError('course with given id does not exist', 400));
        }

        let lectureDuration = duration; // Use provided duration if available

        // If videoUrl is provided, duration will be fetched from YouTube API via frontend
        // No need to fetch duration here for videoUrl

        const lectureData = {
            title,
            description,
            lecture: {},
            duration: lectureDuration
        }

        // file upload or video URL
        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'Learning-Management-System',
                    resource_type: "video"
                });
                if (result) {
                    lectureData.lecture.public_id = result.public_id;
                    lectureData.lecture.secure_url = result.secure_url;
                }

                if (!lectureDuration && req.file) {
                    const fetchedDuration = await videoDuration(req.file.path);
                    lectureDuration = `${Math.round(fetchedDuration / 60)}m`;
                }

                fs.rmSync(`uploads/${req.file.filename}`);
            } catch (e) {
                 return next(new AppError(e.message, 500));
            }
        } else if (videoUrl) {
            lectureData.lecture.secure_url = videoUrl;
        }

        course.lectures.push(lectureData);
        course.numberOfLectures = course.lectures.length;

        await course.save();

        res.status(200).json({
            success: true,
            message: 'lecture added successfully'
        })

    } catch (e) {
         return next(new AppError(e.message, 500));
    }
}

// delete lecture by course id and lecture id
const deleteCourseLecture = async (req, res, next) => {
    try {
        const { courseId, lectureId } = req.query;

        const course = await courseModel.findById(courseId);

        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        const lectureIndex = course.lectures.findIndex(lecture => lecture._id.toString() === lectureId);

        if (lectureIndex === -1) {
            return next(new AppError('Lecture not found in the course', 404));
        }

        course.lectures.splice(lectureIndex, 1);

        course.numberOfLectures = course.lectures.length;

        await course.save();

        res.status(200).json({
            success: true,
            message: 'Lecture deleted successfully'
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
};


// update lecture by course id and lecture id
const updateCourseLecture = async (req, res, next) => {
    try {
        const { courseId, lectureId } = req.query;
        const { title, description, videoUrl, duration } = req.body;

        if (!title || !description || (!req.file && !videoUrl)) {
            return next(new AppError('All fields are required, and either a video file or a video URL must be provided.', 400));
        }

        if (req.file && videoUrl) {
            return next(new AppError('Please provide either a video file or a video URL, not both.', 400));
        }

        const course = await courseModel.findById(courseId);

        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        const lectureIndex = course.lectures.findIndex(lecture => lecture._id.toString() === lectureId);

        if (lectureIndex === -1) {
            return next(new AppError('Lecture not found in the course', 404));
        }

        let lectureDuration = duration; // Use provided duration if available

        // If videoUrl is provided, duration will be fetched from YouTube API via frontend
        // No need to fetch duration here for videoUrl

        const updatedLectureData = {
            title,
            description,
            lecture: {
                public_id: null,
                secure_url: null
            },
            duration: lectureDuration
        };

        if (videoUrl) {
            updatedLectureData.lecture.secure_url = videoUrl;
            // If there's an existing video, delete the old one from Cloudinary
            if (course.lectures[lectureIndex].lecture.public_id) {
                await cloudinary.v2.uploader.destroy(course.lectures[lectureIndex].lecture.public_id);
            }
        } else if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'Learning-Management-System',
                    resource_type: "video"
                });
                if (result) {
                    updatedLectureData.lecture.public_id = result.public_id;
                    updatedLectureData.lecture.secure_url = result.secure_url;
                }

                if (!lectureDuration && req.file) {
                    const fetchedDuration = await videoDuration(req.file.path);
                    lectureDuration = `${Math.round(fetchedDuration / 60)}m`;
                }

                // If there's an existing video, delete the old one from Cloudinary
                if (course.lectures[lectureIndex].lecture.public_id) {
                    await cloudinary.v2.uploader.destroy(course.lectures[lectureIndex].lecture.public_id);
                }

                fs.rmSync(`uploads/${req.file.filename}`);
            } catch (e) {
                return next(new AppError(e.message, 500));
            }
        }

        // Update the lecture details
        course.lectures[lectureIndex] = updatedLectureData;

        await course.save();

        res.status(200).json({
            success: true,
            message: 'Lecture updated successfully'
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
};

const getVideoDuration = async (req, res, next) => {
    try {
        const { videoUrl } = req.body;

        if (!videoUrl) {
            return next(new AppError('Video URL is required', 400));
        }

        // Check if it's a YouTube URL
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([^\&\?\n]{11})/;
        const youtubeMatch = videoUrl.match(youtubeRegex);

        // Check if it's a Google Drive URL
        const googleDriveRegex = /(?:https?:\/\/)?drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)(?:\/view)?(?:\?usp=sharing)?/;
        const googleDriveMatch = videoUrl.match(googleDriveRegex);

        if (youtubeMatch && youtubeMatch[1]) {
            const videoId = youtubeMatch[1];
            const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

            if (!YOUTUBE_API_KEY) {
                return next(new AppError('YouTube API key not configured', 500));
            }

            const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${YOUTUBE_API_KEY}`;
            const response = await axios.get(youtubeApiUrl);
            const items = response.data.items;

            if (items.length === 0) {
                return next(new AppError('YouTube video not found', 404));
            }

            const isoDuration = items[0].contentDetails.duration;
            const formattedDuration = convertIsoToDuration(isoDuration);

            res.status(200).json({
                success: true,
                message: 'Video duration fetched successfully',
                duration: formattedDuration
            });
        } else if (googleDriveMatch && googleDriveMatch[1]) {
            const fileId = googleDriveMatch[1];

            // Authenticate with Google Drive API using service account
            const auth = new google.auth.GoogleAuth({
                keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Path to your service account key file
                scopes: ['https://www.googleapis.com/auth/drive.readonly'],
            });
            const authClient = await auth.getClient();
            google.options({auth: authClient});
            const drive = google.drive({ version: 'v3' });

            try {
                const response = await drive.files.get({
                    fileId: fileId,
                    fields: 'videoMediaMetadata', // Request video metadata
                });

                const durationMillis = response.data.videoMediaMetadata?.durationMillis;

                if (durationMillis === undefined) {
                    return next(new AppError('Google Drive video duration not found or not a video file', 404));
                }

                const formattedDuration = convertMillisToDuration(parseInt(durationMillis, 10));

                res.status(200).json({
                    success: true,
                    message: 'Google Drive video duration fetched successfully',
                    duration: formattedDuration
                });
            } catch (error) {
                console.error("Error fetching Google Drive video duration:", error);
                return next(new AppError(`Failed to fetch Google Drive video duration: ${error.message}`, 500));
            }
        } else {
            return next(new AppError('Invalid video URL. Please provide a valid YouTube or Google Drive URL.', 400));
        }
    } catch (e) {
        console.error("Error in getVideoDuration:", e);
        return next(new AppError(`Failed to fetch video duration: ${e.message}`, 500));
    }
};



// add quiz to course by id
const addQuizToCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { question, options, correctAnswer } = req.body;

        if (!question || !options || !correctAnswer) {
            return next(new AppError('All fields are required', 400));
        }

        const course = await courseModel.findById(id);

        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        course.quizzes.push({
            question,
            options,
            correctAnswer
        });

        await course.save();

        // Sync with Quiz Entity
        const existingQuiz = await quizModel.findOne({ course: id });
        if (existingQuiz) {
            existingQuiz.questions = course.quizzes.map(q => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer
            }));
            await existingQuiz.save();
        } else {
            await quizModel.create({
                course: id,
                questions: course.quizzes.map(q => ({
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer
                }))
            });
        }

        res.status(200).json({
            success: true,
            message: 'Quiz added successfully',
            course
        });

    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}
// get enrolled students
const getEnrolledStudents = async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await courseModel.findById(id);
        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        const enrolledStudents = await userModel.find({
            'courseProgress.courseId': id
        }).select('fullName email avatar courseProgress');

        // Filter progress for this specific course
        const studentsWithProgress = enrolledStudents.map(student => {
            const progress = student.courseProgress.find(cp => cp.courseId.toString() === id);
            return {
                ...student.toObject(),
                progress: progress
            };
        });

        res.status(200).json({
            success: true,
            message: 'Enrolled students fetched successfully',
            students: studentsWithProgress
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

// Submit Quiz and Automatic Scoring
const submitQuizAnswers = async (req, res, next) => {
    try {
        const { id } = req.params; // courseId
        const { answers } = req.body; // Array of { questionId, answer }
        const userId = req.user.id;

        const course = await courseModel.findById(id);
        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        let score = 0;
        const results = course.quizzes.map((quiz) => {
            const userAnswer = answers.find((ans) => ans.questionId === quiz._id.toString());
            const isCorrect = userAnswer && userAnswer.answer === quiz.correctAnswer;
            if (isCorrect) score++;
            return {
                quizId: quiz._id,
                isCorrect,
                correctAnswer: quiz.correctAnswer
            };
        });

        // Update User Progress
        const user = await userModel.findById(userId);
        const courseProgress = user.courseProgress.find((cp) => cp.courseId.toString() === id);
        
        if (courseProgress) {
            courseProgress.quizScores.push({
                quizId: id, // Using courseId as generic quiz group ID for now
                score: (score / course.quizzes.length) * 100
            });
            await user.save();

            // Sync with Progress Entity (Status check)
            const existingProgress = await progressModel.findOne({ student: userId, course: id });
            if (existingProgress) {
                existingProgress.status = courseProgress.isCompleted ? 'Completed' : 'In Progress';
                await existingProgress.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Quiz submitted successfully',
            score,
            total: course.quizzes.length,
            percentage: (score / course.quizzes.length) * 100,
            results
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
};

// Update Course Progress
const updateCourseProgress = async (req, res, next) => {
    try {
        const { id } = req.params; // courseId
        const { lectureId } = req.body;
        const userId = req.user.id;

        const user = await userModel.findById(userId);
        const courseProgress = user.courseProgress.find((cp) => cp.courseId.toString() === id);

        if (!courseProgress) {
            return next(new AppError('You are not enrolled in this course', 403));
        }

        if (!courseProgress.lecturesCompleted.includes(lectureId)) {
            courseProgress.lecturesCompleted.push(lectureId);
        }

        // Check for course completion
        const course = await courseModel.findById(id);
        const totalLectures = course.lectures.length;
        
        if (courseProgress.lecturesCompleted.length === totalLectures) {
            courseProgress.isCompleted = true;
        }

        await user.save();

        // Sync with Progress Entity
        const existingProgress = await progressModel.findOne({ student: userId, course: id });
        if (existingProgress) {
            existingProgress.lessonsCompleted = courseProgress.lecturesCompleted;
            existingProgress.status = courseProgress.isCompleted ? 'Completed' : 'In Progress';
            await existingProgress.save();
        } else {
            await progressModel.create({
                student: userId,
                course: id,
                lessonsCompleted: courseProgress.lecturesCompleted,
                status: courseProgress.isCompleted ? 'Completed' : 'In Progress'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Progress updated successfully',
            courseProgress
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
};

// Generate Certificate
const generateCertificate = async (req, res, next) => {
    try {
        const { id } = req.params; // courseId
        const userId = req.user.id;

        const user = await userModel.findById(userId);
        const course = await courseModel.findById(id);
        const progress = user.courseProgress.find((cp) => cp.courseId.toString() === id);

        if (!progress || !progress.isCompleted) {
            return next(new AppError('Course not completed yet', 400));
        }

        const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
        const fileName = `Certificate_${user.fullName.replace(' ', '_')}_${course.title.replace(' ', '_')}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        doc.pipe(res);

        // Certificate Content
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
        
        doc.fontSize(40).text('CERTIFICATE OF COMPLETION', { align: 'center' }).moveDown();
        doc.fontSize(20).text('This is to certify that', { align: 'center' }).moveDown();
        doc.fontSize(30).fillColor('#eab308').text(user.fullName.toUpperCase(), { align: 'center' }).fillColor('black').moveDown();
        doc.fontSize(20).text('has successfully completed the course', { align: 'center' }).moveDown();
        doc.fontSize(25).text(course.title, { align: 'center' }).moveDown();
        doc.fontSize(15).text(`Issued on: ${new Date().toLocaleDateString()}`, { align: 'center' }).moveDown(2);
        
        doc.fontSize(20).text('_________________________', { align: 'left', indent: 50 });
        doc.text('Instructor', { align: 'left', indent: 80 });
        
        doc.end();

        // Create Certificate Entity record if not already exists
        const existingCertificate = await certificateModel.findOne({ user: userId, course: id });
        if (!existingCertificate) {
            await certificateModel.create({
                user: userId,
                course: id,
                dateIssued: new Date()
            });
        }

    } catch (e) {
        return next(new AppError(e.message, 500));
    }
};

// Monitor student progress (Admin Only)
const getStudentProgress = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        // Fetch all progress records for this course
        const progresses = await progressModel.find({ course: courseId })
            .populate('student', 'fullName email')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Student progress fetched successfully',
            progresses
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

export {
    getAllCourses,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    removeCourse,
    addLectureToCourseById,
    deleteCourseLecture,
    updateCourseLecture,
    getVideoDuration,
    addQuizToCourse,
    getEnrolledStudents,
    submitQuizAnswers,
    updateCourseProgress,
    generateCertificate,
    getStudentProgress
}
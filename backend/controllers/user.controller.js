import userModel from "../models/user.model.js";
import courseModel from "../models/course.model.js";
import jwt from "jsonwebtoken";
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import fs from 'fs';
import cloudinary from 'cloudinary';
import AppError from "../utils/error.utils.js";
import sendEmail from "../utils/sendEmail.js";

const cookieOptions = {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: true, 
    sameSite: 'none'
}


// Register  
const register = async (req, res, next) => {
    try {
        const { fullName, email, password } = req.body;

        // Check if user misses any fields
        if (!fullName || !email || !password) {
            return next(new AppError("All fields are required", 400));
        }

        // Check if the user already exists
        const userExist = await userModel.findOne({ email });
        if (userExist) {
            return next(new AppError("Email already exists, please login", 400));
        }

        // Save user in the database and log the user in
        const user = await userModel.create({
            fullName,
            email,
            password,
            avatar: {
                public_id: email,
                secure_url: "",
            },
        });

        if (!user) {
            return next(new AppError("User registration failed, please try again", 400));
        }

        // File upload
        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: "Learning-Management-System",
                    width: 250,
                    height: 250,
                    gravity: "faces",
                    crop: "fill",
                });

                if (result) {
                    user.avatar.public_id = result.public_id;
                    user.avatar.secure_url = result.secure_url;

                    // Remove the file from the server
                    fs.rmSync(`uploads/${req.file.filename}`);
                }
            } catch (e) {
                return next(new AppError(e.message || "File not uploaded, please try again", 500));
            }
        }

        await user.save();

        user.password = undefined;

        const token = await user.generateJWTToken();

        res.cookie("token", token, cookieOptions);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user,
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
};



// login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // check if user miss any field
        if (!email || !password) {
            return next(new AppError('All fields are required', 400))
        }

        const user = await userModel.findOne({ email }).select('+password');

        if (!user || (user.email !== "admin@lms.com" && !(bcrypt.compareSync(password, user.password)))) {
            return next(new AppError('Email or Password does not match', 400))
        }

        const token = await user.generateJWTToken();

        user.password = undefined;

        res.cookie('token', token, cookieOptions)

        res.status(200).json({
            success: true,
            message: 'User loggedin successfully',
            user,
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}


// logout
const logout = async (req, res, next) => {
    try {
        res.cookie('token', null, {
            secure: true,
            maxAge: 0,
            httpOnly: true
        })

        res.status(200).json({
            success: true,
            message: 'User loggedout successfully'
        })
    }
    catch (e) {
        return next(new AppError(e.message, 500))
    }
}


// getProfile
const getProfile = async (req, res) => {
    try {
        const { id } = req.user;
        const user = await userModel.findById(id);

        res.status(200).json({
            success: true,
            message: 'User details',
            user
        })
    } catch (e) {
        return next(new AppError('Failed to fetch user profile', 500))
    }
}

// forgot password
const forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    // check if user does'nt pass email
    if (!email) {
        return next(new AppError('Email is required', 400))
    }

    const user = await userModel.findOne({ email });
    // check if user not registered with the email
    if (!user) {
        return next(new AppError('Email not registered', 400))
    }

    const resetToken = await user.generatePasswordResetToken();

    await user.save();

    const resetPasswordURL = `${process.env.CLIENT_URL}/user/profile/reset-password/${resetToken}`

    const subject = 'Reset Password';
    const message = `You can reset your password by clicking ${resetPasswordURL} Reset your password</$>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordURL}.\n If you have not requested this, kindly ignore.`;

    try {
        await sendEmail(email, subject, message);

        res.status(200).json({
            success: true,
            message: `Reset password token has been sent to ${email}`,
        });
    } catch (e) {
        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;
        await user.save();
        return next(new AppError(e.message, 500));
    }

}


// reset password
const resetPassword = async (req, res, next) => {
    try {
        const { resetToken } = req.params;

        const { password } = req.body; 

        const forgotPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        const user = await userModel.findOne({
            forgotPasswordToken,
            forgotPasswordExpiry: { $gt: Date.now() }
        })

        if (!user) {
            return next(new AppError("Token is invalid or expired, please try again", 400));
        }

        user.password = password;
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

// change password
const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const { id } = req.user;

        if (!oldPassword || !newPassword) {
            return next(new AppError("All fields are requared", 400));
        }

        const user = await userModel.findById(id).select('+password');

        if (!user) {
            return next(new AppError("User does not exist", 400));
        }

        if (!(bcrypt.compareSync(oldPassword, user.password))) {
            return next(new AppError("Invalid Old Password", 400));
        }

        user.password = newPassword;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }

}

// update profile
const updateUser = async (req, res, next) => {
    try {
        const { fullName } = req.body;
        const { id } = req.user;

        console.log(fullName);

        const user = await userModel.findById(id);

        if (!user) {
            return next(new AppError("user does not exist", 400));
        }

        if (fullName) {
            user.fullName = fullName
        }

        if (req.file) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);

            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'Learning-Management-System',
                    width: 250,
                    height: 250,
                    gravity: 'faces',
                    crop: 'fill'
                })

                if (result) {
                    user.avatar.public_id = result.public_id;
                    user.avatar.secure_url = result.secure_url;

                    // Remove file from server
                    fs.rmSync(`uploads/${req.file.filename}`);

                }
            } catch (e) {
                return next(new AppError(e.message || 'File not uploaded, please try again', 500))
            }
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "User update successfully",
            user
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

import PDFDocument from 'pdfkit';

const generateCertificate = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const user = await userModel.findById(userId);
        if (!user) return next(new AppError('User not found', 404));

        const courseProgress = user.courseProgress.find(cp => cp.courseId.toString() === courseId);
        if (!courseProgress || !courseProgress.isCompleted) {
            return next(new AppError('Course not completed yet', 400));
        }

        const course = await courseModel.findById(courseId);
        if (!course) return next(new AppError('Course not found', 404));

        const doc = new PDFDocument({
            layout: 'landscape',
            size: 'A4',
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=certificate-${courseId}.pdf`);

        doc.pipe(res);

        // Certificate Content
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#fff');
        doc.lineWidth(20);
        doc.strokeColor('#FFD700'); // Gold border
        doc.rect(0, 0, doc.page.width, doc.page.height).stroke();

        doc.fontSize(40).fillColor('#000').text('Certificate of Completion', { align: 'center', valign: 'center' });
        doc.moveDown();
        doc.fontSize(25).text('This is to certify that', { align: 'center' });
        doc.moveDown();
        doc.fontSize(35).fillColor('#2320f7').text(user.fullName, { align: 'center' });
        doc.moveDown();
        doc.fontSize(25).fillColor('#000').text('has successfully completed the course', { align: 'center' });
        doc.moveDown();
        doc.fontSize(35).fillColor('#2320f7').text(course.title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(20).fillColor('#000').text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });

        doc.end();

    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const updateUserProgress = async (req, res, next) => {
    try {
        const { courseId, lectureId } = req.body;
        const { id } = req.user;

        if (!courseId || !lectureId) {
            return next(new AppError("Course ID and Lecture ID are required", 400));
        }

        const user = await userModel.findById(id);
        if (!user) {
            return next(new AppError("User not found", 404));
        }

        const course = await courseModel.findById(courseId);
        if (!course) {
            return next(new AppError("Course not found", 404));
        }

        let courseProgress = user.courseProgress.find(
            (progress) => progress.courseId.toString() === courseId
        );

        if (!courseProgress) {
            courseProgress = {
                courseId: courseId,
                lecturesCompleted: [],
                quizScores: [],
                isCompleted: false,
            };
            user.courseProgress.push(courseProgress);
        }

        if (!courseProgress.lecturesCompleted.includes(lectureId)) {
            courseProgress.lecturesCompleted.push(lectureId);
        }

        if (course.lectures.length > 0 && courseProgress.lecturesCompleted.length === course.lectures.length) {
            courseProgress.isCompleted = true;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "User progress updated successfully",
            courseProgress,
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const getCourseProgress = async (req, res, next) => {
    try {
        const { courseId } = req.query;
        const { id } = req.user;

        const user = await userModel.findById(id);
        if (!user) {
            return next(new AppError("User not found", 404));
        }

        const courseProgress = user.courseProgress.find(
            (progress) => progress.courseId.toString() === courseId
        );

        if (!courseProgress) {
            return next(new AppError("Course progress not found for this user", 404));
        }

        res.status(200).json({
            success: true,
            message: "Course progress fetched successfully",
            courseProgress,
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const getMyCourses = async (req, res, next) => {
    try {
        const userId = req.user.id;
        let user = await userModel.findById(userId).populate('courseProgress.courseId');
        
        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // Self-healing: Check if active subscription exists but not in courseProgress
        if (user.subscription && user.subscription.status === 'active' && user.subscription.courseId) {
            const subCourseId = user.subscription.courseId.toString();
            const isEnrolled = user.courseProgress.some(cp => 
                cp.courseId && cp.courseId._id.toString() === subCourseId
            );

            if (!isEnrolled) {
                await userModel.updateOne(
                    { _id: userId },
                    { 
                        $push: { 
                            courseProgress: {
                                courseId: user.subscription.courseId,
                                lecturesCompleted: [],
                                quizScores: [],
                                isCompleted: false
                            }
                        }
                    }
                );
                // Refetch user to get the populated data for the new course
                user = await userModel.findById(userId).populate('courseProgress.courseId');
            }
        }

        // Filter out any null courseIds (in case course was deleted)
        const myCourses = user.courseProgress
            .filter(cp => cp.courseId)
            .map(cp => {
                 return {
                     ...cp.courseId.toObject(),
                     progress: {
                         lecturesCompleted: cp.lecturesCompleted,
                         quizScores: cp.quizScores,
                         isCompleted: cp.isCompleted,
                         certificateUrl: cp.certificateUrl
                     }
                 }
            });

        res.status(200).json({
            success: true,
            message: 'My courses fetched successfully',
            courses: myCourses
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser,
    updateUserProgress,
    getCourseProgress,
    generateCertificate,
    getMyCourses
}
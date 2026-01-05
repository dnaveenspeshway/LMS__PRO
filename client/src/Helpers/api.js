import axios from "axios";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

const api = axios.create({
    baseURL: BASE_URL + '/api/v1',
    withCredentials: true
});

// User Routes
export const register = (data) => api.post('/user/register', data);
export const login = (data) => api.post('/user/login', data);
export const logout = () => api.get('/user/logout');
export const getProfile = () => api.get('/user/me');
export const getMyCourses = () => api.get('/user/my-courses');
export const forgotPassword = (data) => api.post('/user/reset', data);
export const resetPassword = (token, data) => api.post(`/user/reset/${token}`, data);
export const changePassword = (data) => api.post('/user/change-password', data);
export const updateUser = (id, data) => api.post(`/user/update/${id}`, data);
export const updateUserProgress = (data) => api.post('/user/progress', data);
export const getCourseProgress = (courseId) => api.get(`/user/progress?courseId=${courseId}`);
export const updateQuizScore = (data) => api.post('/user/progress/quiz', data);
export const generateCertificate = (courseId) => api.get(`/user/certificate/${courseId}`, { responseType: 'blob' });

// Course Routes
export const getAllCourses = (params) => api.get('/courses', { params });
export const createCourse = (data) => api.post('/courses', data);
export const deleteCourseLecture = (params) => api.delete('/courses', { params });
export const updateCourseLecture = (params, data) => api.put('/courses', data, { params });
export const getVideoDuration = (data) => api.post('/courses/get-video-duration', data);

export const addQuizToCourse = (id, data) => api.post(`/courses/${id}/quiz`, data);
export const deleteQuizFromCourse = (courseId, quizId) => api.delete(`/courses/${courseId}/quiz/${quizId}`);
export const updateQuizInCourse = (courseId, quizId, data) => api.put(`/courses/${courseId}/quiz/${quizId}`, data);

export const addQuizToLecture = (courseId, lectureId, data) => api.post(`/courses/${courseId}/lectures/${lectureId}/quiz`, data);
export const deleteQuizFromLecture = (courseId, lectureId, quizId) => api.delete(`/courses/${courseId}/lectures/${lectureId}/quiz/${quizId}`);
export const updateQuizInLecture = (courseId, lectureId, quizId, data) => api.put(`/courses/${courseId}/lectures/${lectureId}/quiz/${quizId}`, data);

export const getEnrolledStudents = (id) => api.get(`/courses/${id}/students`);
export const getLecturesByCourseId = (id) => api.get(`/courses/${id}`);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const removeCourse = (id) => api.delete(`/courses/${id}`);
export const addLectureToCourseById = (id, data) => api.post(`/courses/${id}`, data);

// Payment Routes
export const getRazorPayApiKey = () => api.get('/payments/razorpay-key');
export const buySubscription = (data) => api.post('/payments/subscribe', data);
export const verifySubscription = (data) => api.post('/payments/verify', data);
export const cancelSubscription = (data) => api.post('/payments/unsubscribe', data);
export const allPayments = (params) => api.get('/payments', { params });

// Miscellaneous Routes
export const contactUs = (data) => api.post('/contact', data);
export const getAdminStats = () => api.get('/admin/stats/users');

export default api;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import * as api from '../../Helpers/api';
import toast from 'react-hot-toast';

const initialState = {
    lectures: [],
}

// .....get lectures for a specific course....
export const getCourseLectures = createAsyncThunk("/courses/lecture/get", async (id) => {
    try {
        const res = await api.getLecturesByCourseId(id);
        return res?.data;
    } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to load lectures");
        throw error
    }
})

// .....add course lecture for a specific course....
export const addCourseLecture = createAsyncThunk("/courses/lecture/add", async (data) => {
    const loadingId = toast.loading("Adding Lecture...");
    try {
        const res = await api.addLectureToCourseById(data.id, data.formData);
        toast.success("Lecture Added Successfully", { id: loadingId })
        return res?.data;
    } catch (error) {
        toast.error(error?.response?.data?.message, { id: loadingId })
        throw error
    }
})

// .....delete course lecture for a specific course....
export const deleteCourseLecture = createAsyncThunk("/courses/lecture/delete", async (data) => {
    const loadingId = toast.loading("Deleting Lecture...");
    console.log(data);
    try {
        const res = await api.deleteCourseLecture({ courseId: data.courseId, lectureId: data.lectureId });
        toast.success("Lecture Deleted Successfully", { id: loadingId })
        return res?.data;
    } catch (error) {
        toast.error(error?.response?.data?.message, { id: loadingId })
        throw error
    }
})

// ....add quiz to specific lecture...
export const addLectureQuiz = createAsyncThunk("/courses/lecture/quiz/add", async (data) => {
    const loadingId = toast.loading("Adding Quiz to Lecture...");
    try {
        const res = await api.addQuizToLecture(data.courseId, data.lectureId, data.quizData);
        toast.success("Quiz Added Successfully", { id: loadingId })
        return res?.data;
    } catch (error) {
        toast.error(error?.response?.data?.message, { id: loadingId })
        throw error
    }
})

const lectureSlice = createSlice({
    name: 'lecture',
    initialState,
    reducers: {},
    extraReducers: (builder) => {

        // for get Course Lectures
        builder.addCase(getCourseLectures.fulfilled, (state, action) => {
            state.lectures = action?.payload?.course?.lectures
            state.quizzes = action?.payload?.course?.quizzes
        })

        // for add Course Lectures
        builder.addCase(addCourseLecture.fulfilled, (state, action) => {
            state.lectures = action?.payload?.course?.lectures
        })
    }
})

export default lectureSlice.reducer
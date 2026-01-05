import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import * as api from '../../Helpers/api';

const initialState = {
    coursesData: []
}

// ....get all courses....
export const getAllCourses = createAsyncThunk("/courses/get", async () => {
    try {
        const res = await api.getAllCourses();
        return res?.data
    } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to fetch courses");
        throw error;
    }
})

// ....create course....
export const createNewCourse = createAsyncThunk("/courses/create", async (data) => {
    const loadingMessage = toast.loading("Creating course...");
    try {
        const res = await api.createCourse(data);
        toast.success(res?.data?.message, { id: loadingMessage });
        return res?.data
    } catch (error) {
        toast.error(error?.response?.data?.message, { id: loadingMessage });
        throw error;
    }
})

// ....delete course......
export const deleteCourse = createAsyncThunk("/course/delete", async (id) => {
    const loadingId = toast.loading("deleting course ...")
    try {
        const response = await api.removeCourse(id);
        toast.success("Courses deleted successfully", { id: loadingId });
        return response?.data
    } catch (error) {
        toast.error("Failed to delete course", { id: loadingId });
        throw error
    }
});

const courseSlice = createSlice({
    name: 'course',
    initialState,
    reducers: {},
    extraReducers: (builder) => {

        // for get all courses
        builder.addCase(getAllCourses.fulfilled, (state, action) => {
            state.coursesData = action?.payload?.courses;
        })
    }
})

export default courseSlice.reducer;
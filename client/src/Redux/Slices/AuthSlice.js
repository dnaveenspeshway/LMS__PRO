import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import * as api from '../../Helpers/api';

const initialState = {
    isLoggedIn: localStorage.getItem("isLoggedIn") || false,
    role: localStorage.getItem("role") || "",
    data: (localStorage.getItem("data") !== "undefined" && localStorage.getItem("data") !== null) ? JSON.parse(localStorage.getItem("data")) : {}
}

// .....signup.........
export const createAccount = createAsyncThunk("/auth/signup", async (data, { rejectWithValue }) => {
    const loadingMessage = toast.loading("Please wait! creating your account...");
    try {
        const res = await api.register(data);
        toast.success(res?.data?.message, { id: loadingMessage });
        return res?.data;
    } catch (error) {
        toast.error(error?.response?.data?.message || "Something went wrong", { id: loadingMessage });
        return rejectWithValue(error?.response?.data);
    }
})

// .....Login.........
export const login = createAsyncThunk("/auth/login", async (data, { rejectWithValue }) => {
    const loadingMessage = toast.loading("Please wait! logging into your account...");
    try {
        const res = await api.login(data);
        toast.success(res?.data?.message, { id: loadingMessage });
        return res?.data;
    } catch (error) {
        toast.error(error?.response?.data?.message || "Something went wrong", { id: loadingMessage });
        return rejectWithValue(error?.response?.data);
    }
})

// .....Logout.........
export const logout = createAsyncThunk("/auth/logout", async (_, { rejectWithValue }) => {
    const loadingMessage = toast.loading("logout...");
    try {
        const res = await api.logout();
        toast.success(res?.data?.message, { id: loadingMessage });
        return res?.data;
    } catch (error) {
        toast.error(error?.response?.data?.message || "Logout failed", { id: loadingMessage });
        return rejectWithValue(error?.response?.data);
    }
})

// .....get user data.........
export const getUserData = createAsyncThunk("/auth/user/me", async () => {
    try {
        const res = await api.getProfile();
        return res?.data;
    } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to fetch profile");
        throw error;
    }
})

// .....update user data.........
export const updateUserData = createAsyncThunk("/auth/user/update", async (data, { rejectWithValue }) => {
    const loadingMessage = toast.loading("Updating changes...");
    try {
        const res = await api.updateUser(data.id, data.formData);
        toast.success(res?.data?.message, { id: loadingMessage });
        return res?.data;
    } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to update profile", { id: loadingMessage });
        return rejectWithValue(error?.response?.data);
    }
})

// .....change user password.......
export const changePassword = createAsyncThunk(
    "/auth/user/changePassword",
    async (userPassword, { rejectWithValue }) => {
        const loadingMessage = toast.loading("Changing password...");
        try {
            const res = await api.changePassword(userPassword);
            toast.success(res?.data?.message, { id: loadingMessage });
            return res?.data;
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to change password", { id: loadingMessage });
            return rejectWithValue(error?.response?.data);
        }
    }
);

// .....forget user password.....
export const forgetPassword = createAsyncThunk(
    "auth/user/forgetPassword",
    async (email, { rejectWithValue }) => {
        const loadingMessage = toast.loading("Please Wait! sending email...");
        try {
            const res = await api.forgotPassword({ email });
            toast.success(res?.data?.message, { id: loadingMessage });
            return res?.data;
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to send reset email", { id: loadingMessage });
            return rejectWithValue(error?.response?.data);
        }
    }
);


// .......reset the user password......
export const resetPassword = createAsyncThunk("/user/reset", async (data, { rejectWithValue }) => {
    const loadingMessage = toast.loading("Please Wait! reseting your password...");
    try {
        const res = await api.resetPassword(data.resetToken, { password: data.password });
        toast.success(res?.data?.message, { id: loadingMessage });
        return res?.data;
    } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to reset password", { id: loadingMessage });
        return rejectWithValue(error?.response?.data);
    }
});

export const getUserProgress = createAsyncThunk("/auth/user/progress", async (courseId) => {
    const res = await api.getCourseProgress(courseId);
    return res?.data;
});

export const updateProgress = createAsyncThunk("/auth/user/updateProgress", async (data) => {
    const res = await api.updateUserProgress(data);
    return res?.data;
});

export const updateUserQuizScore = createAsyncThunk("/auth/user/updateQuizScore", async (data) => {
    const res = await api.updateQuizScore(data);
    return res?.data;
});

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // for signup
        builder.addCase(createAccount.fulfilled, (state, action) => {
            localStorage.setItem("data", JSON.stringify(action?.payload?.user));
            localStorage.setItem("role", action?.payload?.user?.role);
            localStorage.setItem("isLoggedIn", true);
            state.data = action?.payload?.user;
            state.role = action?.payload?.user?.role;
            state.isLoggedIn = true;
        })

        // for login
        builder.addCase(login.fulfilled, (state, action) => {
            localStorage.setItem("data", JSON.stringify(action?.payload?.user));
            localStorage.setItem("role", action?.payload?.user?.role);
            localStorage.setItem("isLoggedIn", true);
            state.data = action?.payload?.user;
            state.role = action?.payload?.user?.role;
            state.isLoggedIn = true;
        })

        // for logout
        builder.addCase(logout.fulfilled, (state, action) => {
            localStorage.removeItem("data");
            localStorage.removeItem("role");
            localStorage.removeItem("isLoggedIn");
            state.data = {};
            state.role = "";
            state.isLoggedIn = false;
        })

        // for get user data
        builder.addCase(getUserData.fulfilled, (state, action) => {
            localStorage.setItem("data", JSON.stringify(action?.payload?.user));
            localStorage.setItem("role", action?.payload?.user?.role);
            localStorage.setItem("isLoggedIn", true);
            state.data = action?.payload?.user;
            state.role = action?.payload?.user?.role;
            state.isLoggedIn = true;
        })
        builder.addCase(updateProgress.rejected, (state, action) => {
            toast.error(action.error.message);
        })
    }
})


export default authSlice.reducer;
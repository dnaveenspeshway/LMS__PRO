import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import * as api from '../../Helpers/api';

const initialState = {
    isLoggedIn: localStorage.getItem("isLoggedIn") || false,
    role: localStorage.getItem("role") || "",
    data: (localStorage.getItem("data") !== "undefined" && localStorage.getItem("data") !== null) ? JSON.parse(localStorage.getItem("data")) : {}
}

// .....signup.........
export const createAccount = createAsyncThunk("/auth/signup", async (data) => {
    const loadingMessage = toast.loading("Please wait! creating your account...");
    const res = await api.register(data);
    toast.success(res?.data?.message, { id: loadingMessage });
    return res?.data
})

// .....Login.........
export const login = createAsyncThunk("/auth/login", async (data) => {
    const loadingMessage = toast.loading("Please wait! logging into your account...");
    const res = await api.login(data);
    toast.success(res?.data?.message, { id: loadingMessage });
    return res?.data
})

// .....Logout.........
export const logout = createAsyncThunk("/auth/logout", async () => {
    const loadingMessage = toast.loading("logout...");
    const res = await api.logout();
    toast.success(res?.data?.message, { id: loadingMessage });
    return res?.data
})

// .....get user data.........
export const getUserData = createAsyncThunk("/auth/user/me", async () => {
    const loadingMessage = toast.loading("fetching profile...");
    const res = await api.getProfile();
    toast.success(res?.data?.message, { id: loadingMessage });
    return res?.data
})

// .....update user data.........
export const updateUserData = createAsyncThunk("/auth/user/me", async (data) => {
    const loadingMessage = toast.loading("Updating changes...");
    const res = await api.updateUser(data.id, data.formData);
    toast.success(res?.data?.message, { id: loadingMessage });
    return res?.data
})

// .....change user password.......
export const changePassword = createAsyncThunk(
    "/auth/user/changePassword",
    async (userPassword) => {
        const loadingMessage = toast.loading("Changing password...");
        const res = await api.changePassword(userPassword);
        toast.success(res?.data?.message, { id: loadingMessage });
        return res?.data
    }
);

// .....forget user password.....
export const forgetPassword = createAsyncThunk(
    "auth/user/forgetPassword",
    async (email) => {
        const loadingMessage = toast.loading("Please Wait! sending email...");
        const res = await api.forgotPassword({ email });
        toast.success(res?.data?.message, { id: loadingMessage });
        return res?.data
    }
);


// .......reset the user password......
export const resetPassword = createAsyncThunk("/user/reset", async (data) => {
    const loadingMessage = toast.loading("Please Wait! reseting your password...");
    const res = await api.resetPassword(data.resetToken, { password: data.password });
    toast.success(res?.data?.message, { id: loadingMessage });
    return res?.data
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
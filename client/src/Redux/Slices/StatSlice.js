import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../Helpers/api";
import toast from "react-hot-toast";

const initialState = {
    allUsersCount: 0,
    subscribedCount: 0
};

// ......get stats data......
export const getStatsData = createAsyncThunk("stats/get", async () => {
    try {
        const response = await api.getAdminStats();
        return response?.data;
    } catch (error) {
        toast.error("Failed to get stats");
        throw error
    }
})

const statSlice = createSlice({
    name: "state",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getStatsData.fulfilled, (state, action) => {
            state.allUsersCount = action?.payload?.allUsersCount;
            state.subscribedCount = action?.payload?.subscribedUsersCount;
        })
    }
});

export default statSlice.reducer;
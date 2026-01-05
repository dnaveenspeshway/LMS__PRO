import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import * as api from '../../Helpers/api';

const initialState = {
    key: "",
    order_id: "",
    isPaymentVerified: false,
    allPayments: [],
    finalMonths: {},
    monthlySalesRecord: [],
    totalSubscriptions: 0,
    totalRevenue: 0
}

// ....get razorpay key id.....
export const getRazorPayId = createAsyncThunk("/payments/keyId", async () => {
    try {
        const response = await api.getRazorPayApiKey();
        return response?.data;
    } catch (error) {
        toast.error("Failed to load Razorpay key");
        throw error
    }
})

// ....purchase course bundle.....
export const purchaseCourseBundle = createAsyncThunk("/payments/subscribe", async (data) => {
    try {
        const response = await api.buySubscription(data);
        return response?.data;
    } catch (error) {
        toast.error(error?.response?.data?.message);
        throw error
    }
})

// ....verify payment.....
export const verifyUserPayment = createAsyncThunk("/payments/verify", async (data) => {
    const loadingId = toast.loading("Subscribing bundle...");
    try {
        const response = await api.verifySubscription(data);
        toast.success("Payment verified", { id: loadingId });
        return response?.data;
    } catch (error) {
        toast.error(error?.response?.data?.message, { id: loadingId });
        throw error
    }
})

// .....get payment record......
export const getPaymentRecord = createAsyncThunk("/payments/record", async () => {
    try {
        const response = await api.allPayments({ count: 100 });
        return response?.data;
    } catch (error) {
        toast.error("Failed to fetch payment records");
        throw error;
    }
});

// .....cancel subscription......
export const cancelCourseBundle = createAsyncThunk("/payments/cancel", async () => {
    const loadingId = toast.loading("unsubscribing the bundle...")
    try {
        const response = await api.cancelSubscription();
        toast.success(response?.data?.message, { id: loadingId });
        return response?.data;
    } catch (error) {
        toast.error(error?.response?.data?.message, { id: loadingId });
        throw error;
    }
})

const razoraySlice = createSlice({
    name: 'razorpay',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // for ge tRazorPay Api Key
        builder.addCase(getRazorPayId.fulfilled, (state, action) => {
            state.key = action?.payload?.key
        })

        // for purchase course bundle
        builder.addCase(purchaseCourseBundle.fulfilled, (state, action) => {
            state.order_id = action?.payload?.order_id
        })

        // for verify payment
        builder.addCase(verifyUserPayment.fulfilled, (state, action) => {
            state.isPaymentVerified = action?.payload?.success
        })

        // for getPaymentRecord
        builder.addCase(getPaymentRecord.fulfilled, (state, action) => {
            state.allPayments = action?.payload?.allPayments;
            state.finalMonths = action?.payload?.finalMonths;
            state.monthlySalesRecord = action?.payload?.monthlySalesRecord;
            state.totalSubscriptions = action?.payload?.totalSubscriptions;
            state.totalRevenue = action?.payload?.totalRevenue;
        })
    }
})

export default razoraySlice.reducer;
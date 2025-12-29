import { model, Schema } from 'mongoose';

const certificateSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    dateIssued: {
        type: Date,
        default: Date.now
    },
    certificateUrl: {
        type: String
    }
}, {
    timestamps: true
});

const Certificate = model('Certificate', certificateSchema);

export default Certificate;

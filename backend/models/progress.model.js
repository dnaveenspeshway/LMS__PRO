import { model, Schema } from 'mongoose';

const progressSchema = new Schema({
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    lessonsCompleted: [
        {
            type: String // lecture ID
        }
    ],
    status: {
        type: String,
        enum: ['In Progress', 'Completed'],
        default: 'In Progress'
    }
}, {
    timestamps: true
});

const Progress = model('Progress', progressSchema);

export default Progress;

import { model, Schema } from 'mongoose';

const enrollmentSchema = new Schema({
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    }
}, {
    timestamps: true
});

const Enrollment = model('Enrollment', enrollmentSchema);

export default Enrollment;

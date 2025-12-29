import { model, Schema } from 'mongoose';

const quizSchema = new Schema({
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    questions: [
        {
            question: {
                type: String,
                required: true
            },
            options: [
                {
                    type: String,
                    required: true
                }
            ],
            correctAnswer: {
                type: String,
                required: true
            }
        }
    ]
}, {
    timestamps: true
});

const Quiz = model('Quiz', quizSchema);

export default Quiz;

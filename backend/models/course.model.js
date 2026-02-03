import { model, Schema } from "mongoose";

const courseSchema = new Schema({
    title: {
        type: String,
        unique: true,
        required: [true, 'Title is required'],
        minLength: [8, 'Title must be at least 8 character'],
        maxLength: [59, 'Title should be less than 60 character'],
        trim: true
    },
    description: {
        type: String,
        required: true,
        minLength: [8, 'Description must be at least 8 character'],
        maxLength: [500, 'Description should be less than 500 character'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        default: 0
    },
    thumbnail: {
        public_id: {
            type: String
        },
        secure_url: {
            type: String
        }
    },
    lectures: [
        {
            title: String,
            description: String,
            duration: String, // New duration field
            lecture: {
                public_id: {
                    type: String,
                    required: false
                },
                secure_url: {
                    type: String,
                    required: false
                }
            },
            duration: {
                type: String,
                required: false
            },
            // Per-lecture quizzes
            quizzes: [
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
        }
    ],
    // Global quizzes (legacy or course-level)
    quizzes: [
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
    ],
    numberOfLectures: {
        type: Number,
        default: 0
    }
},
    {
        timestamps: true
    })

const Course = model("Course", courseSchema);

export default Course
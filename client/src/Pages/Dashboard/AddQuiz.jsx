import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { addLectureQuiz, getCourseLectures } from "../../Redux/Slices/LectureSlice";
import InputBox from "../../Components/InputBox/InputBox";
import TextArea from "../../Components/InputBox/TextArea";
import Layout from "../../Layout/Layout";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { FaTrash, FaEdit } from "react-icons/fa";
import { updateQuizInLecture, addQuizToCourse, deleteQuizFromLecture } from "../../Helpers/api";

export default function AddQuiz() {
    const courseDetails = useLocation().state;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { lectures } = useSelector((state) => state.lecture);

    const [userInput, setUserInput] = useState({
        question: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correctAnswer: ""
    });

    const [isEditing, setIsEditing] = useState(null);

    useEffect(() => {
        if (courseDetails?._id) {
            dispatch(getCourseLectures(courseDetails._id));
        }
    }, [courseDetails, dispatch]);

    const currentLecture = lectures?.find((l) => l._id === courseDetails?.lectureId);
    const existingQuizzes = currentLecture?.quizzes || [];

    function handleInputChange(e) {
        const { name, value } = e.target;
        setUserInput({ ...userInput, [name]: value });
    }

    async function onFormSubmit(e) {
        e.preventDefault();
        if (!userInput.question || !userInput.option1 || !userInput.option2 || !userInput.option3 || !userInput.option4 || !userInput.correctAnswer) {
            toast.error("All fields are required");
            return;
        }

        const options = [userInput.option1, userInput.option2, userInput.option3, userInput.option4];
        if (!options.includes(userInput.correctAnswer)) {
            toast.error("Correct answer must match one of the options");
            return;
        }

        const quizData = {
            question: userInput.question,
            options: options,
            correctAnswer: userInput.correctAnswer
        };

        if (courseDetails?.lectureId) {
            if (isEditing) {
                // UPDATE QUIZ
                try {
                    const res = await updateQuizInLecture(courseDetails._id, courseDetails.lectureId, isEditing, quizData);
                    if (res.data.success) {
                        toast.success("Quiz updated successfully");
                        setIsEditing(null);
                        dispatch(getCourseLectures(courseDetails._id));
                        setUserInput({
                            question: "",
                            option1: "",
                            option2: "",
                            option3: "",
                            option4: "",
                            correctAnswer: ""
                        });
                    }
                } catch (err) {
                    toast.error(err.response?.data?.message || "Failed to update quiz");
                }
            } else {
                // CREATE QUIZ
                const response = await dispatch(addLectureQuiz({ courseId: courseDetails._id, lectureId: courseDetails.lectureId, quizData }));
                if (response?.payload?.success) {
                    dispatch(getCourseLectures(courseDetails._id));
                    setUserInput({
                        question: "",
                        option1: "",
                        option2: "",
                        option3: "",
                        option4: "",
                        correctAnswer: ""
                    });
                }
            }
        } else {
            // Fallback for legacy global quiz adding (though AddAssignment handles this now)
            try {
                const res = await addQuizToCourse(courseDetails._id, quizData);
                if (res.data.success) {
                    toast.success("Quiz added successfully");
                    navigate(-1);
                }
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to add quiz");
            }
        }
    }

    async function handleDelete(quizId) {
        if (!window.confirm("Are you sure you want to delete this quiz?")) return;
        try {
            const res = await deleteQuizFromLecture(courseDetails._id, courseDetails.lectureId, quizId);
            if (res.data.success) {
                toast.success("Quiz deleted successfully");
                dispatch(getCourseLectures(courseDetails._id));
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Failed to delete quiz");
        }
    }

    function handleEdit(quiz) {
        setIsEditing(quiz._id);
        setUserInput({
            question: quiz.question,
            option1: quiz.options[0],
            option2: quiz.options[1],
            option3: quiz.options[2],
            option4: quiz.options[3],
            correctAnswer: quiz.correctAnswer
        });
        window.scrollTo(0, 0);
    }

    function cancelEdit() {
        setIsEditing(null);
        setUserInput({
            question: "",
            option1: "",
            option2: "",
            option3: "",
            option4: "",
            correctAnswer: ""
        });
    }

    return (
        <Layout>
            <section className="flex flex-col gap-6 items-center py-8 px-3 min-h-[100vh]">
                <form onSubmit={onFormSubmit} className="flex flex-col dark:bg-base-100 gap-7 rounded-lg md:py-5 py-7 md:px-7 px-3 md:w-[750px] w-full shadow-custom dark:shadow-xl">
                    <header className="flex items-center justify-center relative">
                        <button className="absolute left-2 text-xl text-green-500" onClick={() => navigate(-1)}>
                            <AiOutlineArrowLeft />
                        </button>
                        <h1 className="text-center dark:text-purple-500 md:text-4xl text-2xl font-bold font-inter">
                            {isEditing ? "Edit Quiz Question" : "Add New Quiz"}
                        </h1>
                    </header>
                    <div className="flex flex-col gap-5">
                        <TextArea
                            label="Question"
                            name="question"
                            value={userInput.question}
                            onChange={handleInputChange}
                            placeholder="Enter the question"
                        />
                        <div className="grid grid-cols-2 gap-5">
                            <InputBox label="Option 1" name="option1" value={userInput.option1} onChange={handleInputChange} />
                            <InputBox label="Option 2" name="option2" value={userInput.option2} onChange={handleInputChange} />
                            <InputBox label="Option 3" name="option3" value={userInput.option3} onChange={handleInputChange} />
                            <InputBox label="Option 4" name="option4" value={userInput.option4} onChange={handleInputChange} />
                        </div>
                        <InputBox
                            label="Correct Answer"
                            name="correctAnswer"
                            value={userInput.correctAnswer}
                            onChange={handleInputChange}
                            placeholder="Copy exact text of correct option"
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="btn btn-primary w-full py-2 font-semibold text-lg">
                                {isEditing ? "Update Quiz" : "Add Quiz"}
                            </button>
                            {isEditing && (
                                <button type="button" onClick={cancelEdit} className="btn btn-secondary w-1/3 py-2 font-semibold text-lg">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {/* Display Existing Quizzes */}
                {courseDetails?.lectureId && (
                    <div className="md:w-[750px] w-full flex flex-col gap-4">
                        <h2 className="text-2xl font-bold dark:text-white">Existing Quizzes for this Lecture</h2>
                        {existingQuizzes.length > 0 ? (
                            <div className="space-y-4">
                                {existingQuizzes.map((quiz, index) => (
                                    <div key={index} className="border p-4 rounded bg-white dark:bg-base-100 shadow-md relative">
                                        <div className="absolute top-4 right-4 flex gap-3">
                                            <button onClick={() => handleEdit(quiz)} className="text-blue-500 hover:text-blue-700 text-xl">
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleDelete(quiz._id)} className="text-red-500 hover:text-red-700 text-xl">
                                                <FaTrash />
                                            </button>
                                        </div>
                                        <p className="font-semibold text-lg dark:text-gray-200 pr-16">Q{index + 1}: {quiz.question}</p>
                                        <ul className="ml-4 list-disc mt-2 dark:text-gray-300">
                                            {quiz.options.map((opt, i) => (
                                                <li key={i} className={opt === quiz.correctAnswer ? "text-green-600 font-bold" : ""}>
                                                    {opt} {opt === quiz.correctAnswer && "(Correct)"}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No quizzes added for this lecture yet.</p>
                        )}
                    </div>
                )}
            </section>
        </Layout>
    );
}

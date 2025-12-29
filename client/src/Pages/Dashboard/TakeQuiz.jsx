import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../Layout/Layout";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { axiosInstance } from "../../Helpers/axiosInstance";

export default function TakeQuiz() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [answers, setAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [score, setScore] = useState(null);

    useEffect(() => {
        if (!state?.courseId) {
            navigate("/courses");
            return;
        }

        (async () => {
            try {
                const res = await axiosInstance.get(`/courses/${state.courseId}`);
                if (res.data?.course?.quizzes) {
                    setQuizzes(res.data.course.quizzes);
                }
            } catch (err) {
                toast.error("Failed to fetch quizzes");
            } finally {
                setIsLoading(false);
            }
        })();
    }, [state, navigate]);

    function handleOptionChange(questionId, option) {
        setAnswers({
            ...answers,
            [questionId]: option
        });
    }

    async function onFormSubmit(e) {
        e.preventDefault();
        
        if (Object.keys(answers).length < quizzes.length) {
            toast.error("Please answer all questions before submitting");
            return;
        }

        setIsSubmitting(true);
        try {
            const formattedAnswers = Object.keys(answers).map(qId => ({
                questionId: qId,
                answer: answers[qId]
            }));

            const res = await axiosInstance.post(`/courses/${state.courseId}/quiz/submit`, {
                answers: formattedAnswers
            });

            if (res.data.success) {
                setScore(res.data.score);
                toast.success(`Quiz submitted! Your score: ${res.data.score}/${quizzes.length}`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit quiz");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[80vh]">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </Layout>
        );
    }

    if (score !== null) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
                    <h1 className="text-4xl font-bold text-green-500">Quiz Completed!</h1>
                    <div className="text-2xl font-semibold">
                        Your Score: <span className="text-blue-500">{score}</span> / {quizzes.length}
                    </div>
                    <button 
                        onClick={() => navigate(-1)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-8 rounded-md transition-all"
                    >
                        Back to Course
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <section className="flex flex-col gap-6 items-center py-8 px-3 min-h-[100vh]">
                <div className="flex flex-col dark:bg-base-100 gap-7 rounded-lg md:py-5 py-7 md:px-7 px-3 md:w-[750px] w-full shadow-custom dark:shadow-xl">
                    <header className="flex items-center justify-center relative">
                        <button className="absolute left-2 text-xl text-green-500" onClick={() => navigate(-1)}>
                            <AiOutlineArrowLeft />
                        </button>
                        <h1 className="text-center dark:text-purple-500 md:text-3xl text-xl font-bold font-inter">
                            Quiz: {state?.title}
                        </h1>
                    </header>

                    <form onSubmit={onFormSubmit} className="flex flex-col gap-8">
                        {quizzes.map((quiz, index) => (
                            <div key={quiz._id} className="flex flex-col gap-4 p-4 border rounded-lg dark:border-gray-700">
                                <h3 className="text-lg font-semibold dark:text-white">
                                    {index + 1}. {quiz.question}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {quiz.options.map((option, optIndex) => (
                                        <label 
                                            key={optIndex}
                                            className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-all ${
                                                answers[quiz._id] === option 
                                                    ? "bg-blue-100 border-blue-500 dark:bg-blue-900/30" 
                                                    : "hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-600"
                                            }`}
                                        >
                                            <input 
                                                type="radio" 
                                                name={quiz._id} 
                                                value={option}
                                                checked={answers[quiz._id] === option}
                                                onChange={() => handleOptionChange(quiz._id, option)}
                                                className="radio radio-primary radio-sm"
                                            />
                                            <span className="dark:text-slate-300">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="btn btn-primary w-full py-3 font-semibold text-lg"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Quiz"}
                        </button>
                    </form>
                </div>
            </section>
        </Layout>
    );
}

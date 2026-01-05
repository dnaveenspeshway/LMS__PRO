import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateUserQuizScore } from '../../Redux/Slices/AuthSlice';
import Layout from '../../Layout/Layout';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import toast from 'react-hot-toast';

export default function AssignmentPage() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const quizzes = state?.quizzes || [];
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');

    const handleOptionSelect = (option) => {
        setSelectedOption(option);
    };

    const dispatch = useDispatch();

    const handleNextQuestion = async () => {
        if (!selectedOption) {
            toast.error("Please select an option");
            return;
        }

        let newScore = score;
        if (selectedOption === quizzes[currentQuestion].correctAnswer) {
            newScore = score + 1;
            setScore(newScore);
        }

        const nextQuestion = currentQuestion + 1;
        if (nextQuestion < quizzes.length) {
            setCurrentQuestion(nextQuestion);
            setSelectedOption('');
        } else {
            setShowScore(true);
            await dispatch(updateUserQuizScore({
                courseId: state._id,
                isFinalAssignment: true,
                score: newScore
            }));
        }
    };

    const handleRetake = () => {
        setCurrentQuestion(0);
        setScore(0);
        setShowScore(false);
        setSelectedOption('');
    };

    return (
        <Layout>
            <div className="flex flex-col items-center justify-center min-h-[90vh] py-10 px-5 relative">
                <button className="absolute top-5 left-5 text-2xl text-accent cursor-pointer" onClick={() => navigate(-1)}>
                    <AiOutlineArrowLeft />
                </button>
                <div className="md:w-[600px] w-full bg-white dark:bg-base-100 shadow-xl rounded-lg p-8">
                    {showScore ? (
                        <div className="text-center space-y-5">
                            <h2 className="text-3xl font-bold text-accent">Assignment Completed!</h2>
                            <p className="text-xl">
                                You scored <span className="font-bold text-success">{score}</span> out of <span className="font-bold text-primary">{quizzes.length}</span>
                            </p>
                            <div className="text-6xl my-5">
                                {score === quizzes.length ? '🏆' : score > quizzes.length / 2 ? '👍' : '📚'}
                            </div>
                            <button onClick={handleRetake} className="btn btn-primary btn-outline mr-4">Retake Assignment</button>
                            <button onClick={() => navigate(-1)} className="btn btn-secondary">Back to Course</button>
                        </div>
                    ) : (
                        quizzes.length > 0 ? (
                            <div className="flex flex-col gap-6">
                                <div className="flex justify-between items-center border-b pb-4">
                                    <h2 className="text-xl font-semibold text-primary">Question {currentQuestion + 1}/{quizzes.length}</h2>
                                    <span className="text-sm text-gray-500">Final Assignment</span>
                                </div>
                                <div className="text-lg font-medium min-h-[80px]">
                                    {quizzes[currentQuestion]?.question}
                                </div>
                                <div className="flex flex-col gap-3">
                                    {quizzes[currentQuestion]?.options.map((option, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleOptionSelect(option)}
                                            className={`p-3 rounded-md border text-left transition-all duration-200 ${selectedOption === option
                                                ? "bg-accent text-white border-accent transform scale-102"
                                                : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleNextQuestion}
                                    className="btn btn-primary mt-4 w-full text-lg"
                                >
                                    {currentQuestion === quizzes.length - 1 ? "Finish Assignment" : "Next Question"}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-error">No assignment questions found for this course.</h2>
                                <button onClick={() => navigate(-1)} className="btn btn-primary mt-5">Go Back</button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </Layout>
    );
}

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateUserQuizScore } from '../../Redux/Slices/AuthSlice';
import Layout from '../../Layout/Layout';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import toast from 'react-hot-toast';

import api from '../../Helpers/api';

export default function AssignmentPage() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const quizzes = state?.quizzes || [];
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showScore, setShowScore] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');
    const [userAnswers, setUserAnswers] = useState([]);

    const handleOptionSelect = (option) => {
        setSelectedOption(option);
    };

    const dispatch = useDispatch();

    const handleNextQuestion = async () => {
        if (!selectedOption) {
            toast.error("Please select an option");
            return;
        }

        const newUserAnswers = [...userAnswers, selectedOption];
        setUserAnswers(newUserAnswers);

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
        setUserAnswers([]);
    };

    const percentage = quizzes.length > 0 ? (score / quizzes.length) * 100 : 0;
    const isPassed = percentage >= 65;

    const downloadCertificate = async () => {
        try {
            const response = await api.generateCertificate(state._id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Certificate-${state.title}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Failed to download certificate");
        }
    }

    return (
        <Layout>
            <div className="flex flex-col items-center justify-center min-h-[90vh] py-10 px-5 relative">
                <button className="absolute top-5 left-5 text-2xl text-accent cursor-pointer" onClick={() => navigate(-1)}>
                    <AiOutlineArrowLeft />
                </button>
                <div className="md:w-[600px] w-full bg-white dark:bg-base-100 shadow-xl rounded-lg p-8">
                    {showScore ? (
                        <div className="space-y-8">
                            <div className="text-center space-y-4">
                                {isPassed ? (
                                    <>
                                        <h2 className="text-4xl font-black text-success uppercase tracking-widest">Congratulations!</h2>
                                        <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                                            You have successfully completed the course!
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-4xl font-black text-error uppercase tracking-widest">Keep Learning!</h2>
                                        <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                                            You need at least 65% to pass and earn your certificate.
                                        </p>
                                    </>
                                )}
                                <p className="text-xl">
                                    Final Score: <span className={`font-black text-3xl ${isPassed ? 'text-success' : 'text-error'}`}>{percentage.toFixed(0)}%</span>
                                    <span className="ml-2 text-gray-500">({score}/{quizzes.length})</span>
                                </p>

                                <div className="flex flex-col gap-4 pt-4 items-center">
                                    {!isPassed && (
                                        <button onClick={handleRetake} className="btn btn-primary w-full h-14 text-lg">Retake Assignment</button>
                                    )}
                                    {isPassed && (
                                        <button onClick={downloadCertificate} className="btn bg-yellow-500 hover:bg-yellow-600 text-white border-none w-full h-14 text-lg animate-bounce">
                                            Download Certificate 📜
                                        </button>
                                    )}
                                    <button onClick={() => navigate(-1)} className="btn btn-outline w-full h-14 text-lg">Back to Course</button>
                                </div>
                            </div>
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

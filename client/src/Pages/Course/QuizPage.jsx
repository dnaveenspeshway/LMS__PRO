import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateUserQuizScore } from '../../Redux/Slices/AuthSlice';
import Layout from '../../Layout/Layout';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import toast from 'react-hot-toast';

export default function QuizPage() {
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
            if (state?.isFinalAssignment) {
                await dispatch(updateUserQuizScore({
                    courseId: state._id,
                    isFinalAssignment: true,
                    score: newScore
                }));
            } else {
                await dispatch(updateUserQuizScore({
                    courseId: state._id,
                    lectureId: state.lectureId,
                    score: newScore
                }));
            }
        }
    };

    const handleRetake = () => {
        setCurrentQuestion(0);
        setScore(0);
        setShowScore(false);
        setSelectedOption('');
        setUserAnswers([]);
    };

    return (
        <Layout>
            <div className="flex flex-col items-center justify-center min-h-[90vh] py-10 px-5 relative">
                <button className="absolute top-5 left-5 text-2xl text-accent cursor-pointer" onClick={() => navigate(-1)}>
                    <AiOutlineArrowLeft />
                </button>
                <div className={`${showScore ? 'md:w-[800px]' : 'md:w-[600px]'} w-full bg-white dark:bg-base-100 shadow-xl rounded-lg p-8`}>
                    {showScore ? (
                        <div className="space-y-8">
                            <div className="text-center space-y-3">
                                <h2 className="text-3xl font-bold text-accent font-inter">Quiz Completed!</h2>
                                <p className="text-xl">
                                    You scored <span className="font-bold text-success">{score}</span> out of <span className="font-bold text-primary">{quizzes.length}</span>
                                </p>
                                <div className="text-5xl">
                                    {score === quizzes.length ? '🏆' : score > quizzes.length / 2 ? '👍' : '📚'}
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h3 className="text-2xl font-black border-b-4 border-accent pb-2 dark:text-gray-200 uppercase tracking-tight">Review Your Results</h3>
                                {quizzes.map((quiz, index) => {
                                    const isUserCorrect = userAnswers[index] === quiz.correctAnswer;
                                    return (
                                        <div key={index} className="p-6 rounded-2xl border-2 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-lg border-l-[12px] transition-all"
                                            style={{ borderLeftColor: isUserCorrect ? '#22c55e' : '#ef4444' }}>
                                            <div className="flex justify-between items-start gap-4 mb-6">
                                                <h4 className="font-bold text-xl dark:text-white flex-1 leading-tight">
                                                    <span className="text-accent font-black mr-2">Q{index + 1}:</span>
                                                    {quiz.question}
                                                </h4>
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter ${isUserCorrect ? 'bg-success/20 text-success border border-success/30' : 'bg-error/20 text-error border border-error/30'}`}>
                                                    {isUserCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                {quiz.options.map((option, optIdx) => {
                                                    const isSelected = option === userAnswers[index];
                                                    const isCorrect = option === quiz.correctAnswer;

                                                    let borderStyles = "border-gray-100 dark:border-gray-800";
                                                    let bgStyles = "bg-gray-50/50 dark:bg-slate-800/30";
                                                    let badge = null;

                                                    if (isCorrect) {
                                                        borderStyles = "border-success/50 bg-success/5";
                                                        badge = <span className="ml-auto text-[10px] font-black uppercase tracking-widest bg-success text-white px-2 py-1 rounded shadow-sm">Correct Answer</span>;
                                                    }

                                                    if (isSelected && !isCorrect) {
                                                        borderStyles = "border-error/50 bg-error/5";
                                                        badge = <span className="ml-auto text-[10px] font-black uppercase tracking-widest bg-error text-white px-2 py-1 rounded shadow-sm">Your Selection</span>;
                                                    } else if (isSelected && isCorrect) {
                                                        badge = <div className="ml-auto flex gap-2">
                                                            <span className="text-[10px] font-black uppercase tracking-widest bg-success text-white px-2 py-1 rounded shadow-sm">Your Selection ✓</span>
                                                        </div>;
                                                    }

                                                    return (
                                                        <div key={optIdx} className={`flex items-center p-4 rounded-xl border-2 transition-all duration-300 ${borderStyles} ${bgStyles} ${isSelected || isCorrect ? 'scale-[1.01] shadow-sm' : 'opacity-70'}`}>
                                                            <div className={`w-3 h-3 rounded-full mr-3 ${isCorrect ? 'bg-success' : isSelected ? 'bg-error' : 'bg-gray-300'}`}></div>
                                                            <span className={`font-bold ${isCorrect ? 'text-success' : isSelected ? 'text-error' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                {option}
                                                            </span>
                                                            {badge}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-center gap-4 pt-6 border-t dark:border-gray-700">
                                <button onClick={handleRetake} className="btn btn-primary btn-outline px-8">Retake</button>
                                <button onClick={() => navigate(-1)} className="btn btn-secondary px-8">Back to Lectures</button>
                            </div>
                        </div>
                    ) : (
                        quizzes.length > 0 ? (
                            <div className="flex flex-col gap-6">
                                <div className="flex justify-between items-center border-b pb-4">
                                    <h2 className="text-xl font-semibold text-primary">Question {currentQuestion + 1}/{quizzes.length}</h2>
                                    <span className="text-sm text-gray-500">Video Quiz</span>
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
                                    {currentQuestion === quizzes.length - 1 ? "Finish Quiz" : "Next Question"}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-error">No quizzes found for this video.</h2>
                                <button onClick={() => navigate(-1)} className="btn btn-primary mt-5">Go Back</button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </Layout>
    );
}

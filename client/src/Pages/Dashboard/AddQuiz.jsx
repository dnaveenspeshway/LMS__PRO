import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import InputBox from "../../Components/InputBox/InputBox";
import TextArea from "../../Components/InputBox/TextArea";
import Layout from "../../Layout/Layout";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { axiosInstance } from "../../Helpers/axiosInstance";

export default function AddQuiz() {
    const courseDetails = useLocation().state;
    const navigate = useNavigate();
    const [userInput, setUserInput] = useState({
        question: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correctAnswer: ""
    });

    function handleInputChange(e) {
        const { name, value } = e.target;
        setUserInput({ ...userInput, [name]: value });
    }

    async function onFormSubmit(e) {
        e.preventDefault();
        if(!userInput.question || !userInput.option1 || !userInput.option2 || !userInput.option3 || !userInput.option4 || !userInput.correctAnswer) {
            toast.error("All fields are required");
            return;
        }
        
        try {
            const res = await axiosInstance.post(`/courses/${courseDetails._id}/quiz`, {
                question: userInput.question,
                options: [userInput.option1, userInput.option2, userInput.option3, userInput.option4],
                correctAnswer: userInput.correctAnswer
            });
            if(res.data.success) {
                toast.success("Quiz added successfully");
                navigate(-1);
            }
        } catch(err) {
            toast.error(err.response?.data?.message || "Failed to add quiz");
        }
    }

    return (
        <Layout>
             <section className="flex flex-col gap-6 items-center py-8 px-3 min-h-[100vh]">
                <form onSubmit={onFormSubmit} className="flex flex-col dark:bg-base-100 gap-7 rounded-lg md:py-5 py-7 md:px-7 px-3 md:w-[750px] w-full shadow-custom dark:shadow-xl">
                    <header className="flex items-center justify-center relative">
                        <button className="absolute left-2 text-xl text-green-500" onClick={() => navigate(-1)}>
                            <AiOutlineArrowLeft />
                        </button>
                        <h1 className="text-center dark:text-purple-500 md:text-4xl text-2xl font-bold font-inter">Add New Quiz</h1>
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
                         <button type="submit" className="btn btn-primary w-full py-2 font-semibold text-lg">
                            Add Quiz
                        </button>
                    </div>
                </form>
             </section>
        </Layout>
    );
}

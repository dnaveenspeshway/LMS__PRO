import React, { useEffect, useState } from "react";
import Layout from "../../Layout/Layout";
import { getMyCourses } from "../../Helpers/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function MyCourses() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await getMyCourses();
                if (res?.data?.success) {
                    setCourses(res.data.courses);
                }
            } catch (error) {
                toast.error("Failed to load your courses");
            }
        })();
    }, []);

    return (
        <Layout>
            <div className="min-h-[90vh] pt-12 pl-10 flex flex-col gap-10 text-gray-900 dark:text-white">
                <h1 className="text-center text-3xl font-bold font-inter text-yellow-500">
                    My Enrolled Courses
                </h1>

                <div className="flex flex-wrap gap-10 justify-center">
                    {courses?.length > 0 ? (
                        courses.map((course) => {
                            const progress = course.progress;
                            const completedCount = progress?.lecturesCompleted?.length || 0;
                            const totalLectures = course?.numberOfLectures || 1;
                            const percent = Math.round((completedCount / totalLectures) * 100);

                            return (
                                <div key={course._id} className="bg-base-100 dark:bg-slate-800 w-[22rem] shadow-xl cursor-pointer group overflow-hidden rounded-lg">
                                    <div className="overflow-hidden">
                                        <div className="overflow-hidden">
                                            <img
                                                src={course?.thumbnail?.secure_url}
                                                alt="course thumbnail"
                                                className="h-48 w-full rounded-tr-lg rounded-tl-lg group-hover:scale-[1.2] transition-all ease-in-out duration-300"
                                            />
                                        </div>
                                        <div className="p-3 space-y-1">
                                            <h2 className="text-xl font-bold text-yellow-500 line-clamp-2">
                                                {course?.title}
                                            </h2>
                                            <p className="line-clamp-2 text-gray-700 dark:text-gray-300">
                                                {course?.description}
                                            </p>
                                            <div className="mt-2">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-blue-700 dark:text-white">Progress</span>
                                                    <span className="text-sm font-medium text-blue-700 dark:text-white">{percent}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-4">
                                                <button
                                                    onClick={() => navigate("/course/displaylectures", { state: { ...course } })}
                                                    className="bg-yellow-500 px-5 py-2 rounded-md font-bold text-lg w-full hover:bg-yellow-600 transition-all ease-in-out duration-300 text-white"
                                                >
                                                    Continue Learning
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="w-full flex justify-center items-center py-10">
                            <p className="text-2xl font-semibold text-gray-500 font-inter">
                                No courses found
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

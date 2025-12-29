import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

import { axiosInstance } from "../../Helpers/axiosInstance";
import Layout from "../../Layout/Layout";

export default function EnrolledStudents() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);

    useEffect(() => {
        if (!state?._id) navigate("/admin/dashboard");
        (async () => {
            try {
                const res = await axiosInstance.get(`/courses/${state._id}/students`);
                if (res?.data?.success) {
                    setStudents(res.data.students);
                }
            } catch (error) {
                toast.error("Failed to fetch enrolled students");
            }
        })();
    }, []);

    return (
        <Layout>
            <div className="min-h-[90vh] pt-12 pl-10 flex flex-col gap-10 text-white">
                <h1 className="text-center text-3xl font-bold font-inter text-yellow-500">
                    Enrolled Students for <span className="text-purple-500">{state?.title}</span>
                </h1>

                <div className="w-[90%] mx-auto overflow-x-scroll">
                    <table className="table">
                        <thead>
                            <tr className="text-xl text-black dark:text-white">
                                <th>S No</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Lectures Completed</th>
                                <th>Progress</th>
                                <th>Certificate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, idx) => {
                                const progress = student.progress;
                                const completedCount = progress?.lecturesCompleted?.length || 0;
                                const totalLectures = state?.numberOfLectures || 1;
                                const percent = Math.round((completedCount / totalLectures) * 100);

                                return (
                                    <tr key={student._id} className="text-black dark:text-slate-200">
                                        <td>{idx + 1}</td>
                                        <td>{student.fullName}</td>
                                        <td>{student.email}</td>
                                        <td>{completedCount}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
                                                </div>
                                                <span>{percent}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            {progress?.isCompleted ? 
                                                <span className="text-green-500 font-bold">Issued</span> : 
                                                <span className="text-yellow-500">Pending</span>
                                            }
                                        </td>
                                    </tr>
                                );
                            })}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center text-2xl font-bold py-10">
                                        No students enrolled yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import YouTube from 'react-youtube';
import {
  getCourseLectures,
  deleteCourseLecture,
} from "../../Redux/Slices/LectureSlice";
import { getUserProgress, updateProgress } from "../../Redux/Slices/AuthSlice";
import { generateCertificate } from "../../Helpers/api";
import Layout from "../../Layout/Layout";
import toast from "react-hot-toast";

export default function DisplayLecture() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { state } = useLocation();
  const { lectures } = useSelector((state) => state.lecture);
  const { role, data } = useSelector((state) => state.auth);

  const [currentVideo, setCurrentVideo] = useState(0);
  const [userProgress, setUserProgress] = useState({ lecturesCompleted: [] }); // New state for user progress

  useEffect(() => {
    if (!state) navigate("/courses");
    if (role !== "ADMIN" && !data?.courseProgress?.some((cp) => cp.courseId === state?._id)) {
      toast.error("You are not enrolled in this course");
      navigate("/courses");
    }
  }, [role, data, state, navigate]);

  const totalLectures = state?.numberOfLectures || 0; // Define totalLectures
  const completedLectures = userProgress.lecturesCompleted.length; // Calculate completedLectures

  const isCourseCompleted = totalLectures > 0 && completedLectures >= totalLectures;
  const progressPercentage = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

  const handleCertificateDownload = async () => {
    try {
      const response = await generateCertificate(state._id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${state.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download certificate");
    }
  };

  const handleVideoEnded = async () => {
    const lectureId = lectures[currentVideo]._id;
    if (!userProgress.lecturesCompleted.includes(lectureId)) {
      const res = await dispatch(updateProgress({ courseId: state._id, lectureId }));
      if (res?.payload?.success) {
        setUserProgress(res.payload.courseProgress);
      }
    }
  };

  async function onLectureDelete(courseId, lectureId) {
    await dispatch(
      deleteCourseLecture({ courseId: courseId, lectureId: lectureId })
    );
    await dispatch(getCourseLectures(courseId));
  }

  useEffect(() => {
    (async () => {
      if (!state) {
        navigate("/courses");
        return;
      }
      await dispatch(getCourseLectures(state._id));
      const progressRes = await dispatch(getUserProgress(state._id));
      if (progressRes?.payload?.success) {
        setUserProgress(progressRes.payload.courseProgress || { lecturesCompleted: [] });
      }
    })();
  }, [state, dispatch, navigate]); // Add dependencies
  return (
    <Layout hideFooter={true} hideNav={true} hideBar={true}>
      <section className="flex flex-col gap-6 items-center md:py-8 py-0 px-0 h-screen overflow-y-hidden">
        <div className="flex flex-col dark:bg-base-100 relative md:gap-8 gap-5 rounded-lg md:py-10 md:pt-3 py-0 pt-3 md:px-7 px-0 md:w-[1100px] w-full h-full overflow-y-hidden shadow-custom dark:shadow-xl">
          <h1 className="text-center relative md:px-0 px-3 w-fit dark:text-purple-500 md:text-2xl text-lg font-bold font-inter after:content-[' ']  after:absolute after:-bottom-2  md:after:left-0 after:left-3 after:h-[3px] after:w-[60%] after:rounded-full after:bg-yellow-400 dark:after:bg-yellow-600">
            Course:{" "}
            <span className="text-violet-500 dark:text-yellow-500 font-nunito-sans">
              {state?.title}
            </span>
          </h1>
          <div className="flex md:flex-row flex-col md:justify-between w-full flex-1 overflow-hidden">
            {/* left section for lecture video and details */}
            <div className="md:w-[60%] w-full md:p-3 p-1 overflow-y-scroll md:h-full h-[45%] flex flex-col gap-5">
              <div className="w-full border bg-black shadow-lg overflow-hidden flex-shrink-0">
                {lectures && (lectures?.[currentVideo]?.lecture?.secure_url || lectures?.[currentVideo]?.lecture) && (() => {
                  const url = lectures[currentVideo]?.lecture?.secure_url || lectures[currentVideo]?.lecture;
                  // Improved Regex patterns
                  const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([^\&\?\n]{11})/;
                  const driveRegex = /(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/;

                  const youtubeMatch = typeof url === 'string' ? url.match(youtubeRegex) : null;
                  const driveMatch = typeof url === 'string' ? url.match(driveRegex) : null;

                  if (youtubeMatch) {
                    return (
                      <div className="aspect-video w-full bg-black">
                        <YouTube
                          videoId={youtubeMatch[1]}
                          onEnd={handleVideoEnded}
                          opts={{
                            width: '100%',
                            height: '100%',
                            playerVars: {
                              rel: 0,
                              modestbranding: 1,
                              autoplay: 0,
                            },
                          }}
                          className="h-full w-full"
                          iframeClassName="h-full w-full"
                        />
                      </div>
                    );
                  } else if (driveMatch) {
                    return (
                      <div className="flex flex-col w-full h-full">
                        <div className="aspect-video w-full bg-black">
                          <iframe
                            src={`https://drive.google.com/file/d/${driveMatch[1]}/preview`}
                            title="Google Drive Video"
                            className="h-full w-full border-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                          ></iframe>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 px-2 italic">
                          Note: If video is unavailable, ensure "Anyone with link" is enabled in Drive sharing settings.
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <video
                        src={url}
                        disablePictureInPicture
                        disableRemotePlayback
                        controls
                        controlsList="nodownload"
                        className="w-full max-h-[400px] mx-auto"
                        onEnded={handleVideoEnded}
                      ></video>
                    );
                  }
                })()}
              </div>
              <div className="p-1 space-y-6">
                <div>
                  <h2 className="text-blue-500 dark:text-yellow-500 font-inter font-bold text-xl mb-2">Title</h2>
                  <h1 className="text-2xl text-gray-800 dark:text-white font-[600] font-inter">
                    {lectures && lectures?.[currentVideo]?.title}
                  </h1>
                </div>
                <div className="border-t pt-5 pb-10 dark:border-gray-700">
                  <h2 className="text-blue-500 dark:text-yellow-500 font-inter font-bold text-xl mb-2">Description</h2>
                  <p className="text-lg text-gray-700 dark:text-slate-300 font-lato whitespace-pre-wrap break-words leading-relaxed">
                    {lectures && lectures?.[currentVideo]?.description}
                  </p>
                </div>
              </div>
            </div>
            {/* right section for lectures list */}
            <div className="md:w-[38%] pb-12 flex flex-col w-full md:h-full h-[55%] overflow-y-scroll">
              <ul className="w-full md:p-2 p-0  flex flex-col gap-5 shadow-sm">
                <li className="font-semibold bg-slate-50 dark:bg-slate-100 p-3 rounded-md shadow-lg sticky top-0 text-xl text-[#2320f7] font-nunito-sans flex flex-col gap-2">
                  <div className="flex items-center justify-between w-full">
                    <p>Lectures list</p>
                    {role === "ADMIN" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate("/course/addlecture", { state: { ...state } })
                          }
                          className="btn-primary px-3 py-2 font-inter rounded-md font-semibold text-sm"
                        >
                          Add new lecture
                        </button>
                        <button
                          onClick={() =>
                            navigate("/course/addassignment", { state: { ...state } })
                          }
                          className="btn-primary px-3 py-2 font-inter rounded-md font-semibold text-sm bg-purple-500 hover:bg-purple-600"
                        >
                          Add Assignment
                        </button>
                      </div>
                    )}
                  </div>
                  {role === "USER" && (
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-500">Progress</span>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-500">{progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                      </div>
                    </div>
                  )}
                </li>
                {lectures &&
                  lectures.map((lecture, idx) => {
                    return (
                      <li className="space-y-2" key={lecture._id}>
                        <p
                          className={`cursor-pointer text-base font-[500] font-open-sans ${currentVideo === idx
                            ? "text-blue-600 dark:text-yellow-500"
                            : " text-gray-600 dark:text-white"
                            }`}
                          onClick={() => setCurrentVideo(idx)}
                        >
                          <span className="font-inter">{idx + 1}. </span>
                          {lecture?.title}
                          {userProgress?.lecturesCompleted?.includes(lecture?._id) && (
                            <span className="ml-2 text-green-500 text-xs">✔ Watched</span>
                          )}
                        </p>
                        {role === "ADMIN" && (
                          <button
                            onClick={() =>
                              onLectureDelete(state?._id, lecture?._id)
                            }
                            className="bg-[#ff3838] px-2 py-1 rounded-md text-white font-inter font-[500]  text-sm"
                          >
                            Delete lecture
                          </button>
                        )}
                        {role === "ADMIN" && (
                          <button
                            onClick={() =>
                              navigate("/course/addquiz", { state: { ...state, lectureId: lecture._id } })
                            }
                            className="bg-green-500 px-2 py-1 rounded-md text-white font-inter font-[500] text-sm ml-2"
                          >
                            Add Quiz
                          </button>
                        )}
                        {role === "USER" && userProgress?.lecturesCompleted?.includes(lecture?._id) && lecture?.quizzes?.length > 0 && (
                          <div className="inline-flex items-center">
                            <button
                              onClick={() =>
                                navigate("/course/quiz", { state: { ...state, lectureId: lecture._id, quizzes: lecture.quizzes } })
                              }
                              className="bg-blue-500 px-2 py-1 rounded-md text-white font-inter font-[500] text-sm ml-2"
                            >
                              Take Quiz
                            </button>
                            {userProgress?.quizScores?.find(qs => qs.quizId === lecture._id) && (
                              <span className="ml-2 text-green-600 font-bold text-sm">
                                Score: {userProgress.quizScores.find(qs => qs.quizId === lecture._id).score}/{lecture.quizzes.length}
                              </span>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
              </ul>

              {completedLectures >= totalLectures && state?.quizzes?.length > 0 && (
                <div className="mt-8 w-full flex flex-col gap-5 items-center p-6 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50 rounded-xl">
                  {userProgress?.quizScores?.some(q => q.quizId === 'final-assignment') ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-center">
                        <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-1">Your Performance</p>
                        <h2 className="text-2xl font-black text-green-600 font-inter">
                          Final Assignment Score: {userProgress.quizScores.find(q => q.quizId === 'final-assignment').score}/{state.quizzes.length}
                          <span className="ml-3 text-lg opacity-80">
                            ({Math.round((userProgress.quizScores.find(q => q.quizId === 'final-assignment').score / state.quizzes.length) * 100)}%)
                          </span>
                        </h2>
                      </div>
                      <button
                        className={`btn h-12 px-8 text-white font-black uppercase tracking-tighter transition-all duration-300 ${userProgress?.isCompleted ? 'bg-green-600 hover:bg-green-600 cursor-default' : 'btn-primary'}`}
                        onClick={() => {
                          if (!userProgress?.isCompleted) {
                            navigate("/course/assignment", { state: { ...state, quizzes: state.quizzes, isFinalAssignment: true } });
                          }
                        }}
                      >
                        {userProgress?.isCompleted ? "QUALIFIED" : "Retake Assignment"}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn bg-yellow-500 hover:bg-yellow-600 text-white font-black h-14 px-12 text-lg uppercase tracking-widest"
                      onClick={() => navigate("/course/assignment", { state: { ...state, quizzes: state.quizzes, isFinalAssignment: true } })}
                    >
                      Take Final Assignment
                    </button>
                  )}
                </div>
              )}

              {userProgress?.isCompleted && (
                <div className="mt-5 w-full flex justify-center">
                  <button
                    className="btn btn-success btn-lg text-white font-bold animate-pulse"
                    onClick={handleCertificateDownload}
                  >
                    Download Certificate 🏆
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../Redux/Slices/AuthSlice";
import { FiMenu } from "react-icons/fi";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoggedIn } = useSelector((state) => state.auth);

  const onLogout = async () => {
    await dispatch(logout());
    navigate("/");
  };

  const toggleSidebar = () => {
    const drawerToggle = document.getElementById("my-drawer");
    if (drawerToggle) {
      drawerToggle.checked = !drawerToggle.checked;
    }
  };

  return (
    <nav className="sticky top-0 z-50 md:h-[72px] h-[65px] md:px-[35px] px-[15px] bg-[#ffffffd0] dark:bg-[#21242bc5] shadow-custom backdrop-blur-md flex justify-between items-center">
      {/* Left section: Sidebar toggle and Logo */}
      <div className="flex items-center gap-2">
        <button onClick={toggleSidebar} className="p-2 rounded-full text-lg font-semibold">
          <FiMenu size={"32px"} className="text-gray-900 dark:text-white" />
        </button>
        <div className="text-2xl font-bold text-purple-600">LMS</div>
      </div>

      {/* Middle section: Navigation links */}
      <div className="flex items-center gap-5">
        <Link to="/" className="text-gray-900 dark:text-white font-semibold hover:text-purple-600 transition-colors duration-300">
          Home
        </Link>
        <Link to="/about" className="text-gray-900 dark:text-white font-semibold hover:text-purple-600 transition-colors duration-300">
          About Us
        </Link>
        <Link to="/contact" className="text-gray-900 dark:text-white font-semibold hover:text-purple-600 transition-colors duration-300">
          Contact Us
        </Link>
      </div>

      {/* Right section: Login/Logout buttons */}
      <div className="flex items-center gap-5">
        {isLoggedIn ? (
          <>
            <Link to="/user/profile" className="btn-primary px-3.5 py-2.5 font-semibold rounded-md">
              Profile
            </Link>
            <button onClick={onLogout} className="btn-secondary px-3.5 py-2.5 font-semibold rounded-md">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-primary px-3.5 py-2.5 font-semibold rounded-md">
              Login
            </Link>
            <Link to="/signup" className="btn-secondary px-3.5 py-2.5 font-semibold rounded-md">
              Signup
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

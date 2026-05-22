import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const logout = () => {
    console.log("Logging out...");

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);

    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand fw-bold" to="/">
          📚 BooksCafe
        </Link>

        {/* Right Side */}
        <div className="navbar-nav ms-auto align-items-center">
          {user ? (
            <>
              <span className="nav-item nav-link text-light me-3">
                Welcome, {user.full_name} (
                {user.role.charAt(0).toUpperCase() +
                  user.role.slice(1).toLowerCase()}
                )
              </span>
              <button
                onClick={logout}
                className="btn btn-sm btn-outline-danger"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="nav-item nav-link" to="/login">
                Login
              </Link>
              <Link className="nav-item nav-link" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

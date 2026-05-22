import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ user, setUser }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 🔹 Replace with your backend API
      const res = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        console.log(localStorage.getItem("access"));
        // Redirect based on role
        if (data.user.is_librarian) {
          console.log("Redirecting to librarian dashboard..."); // 👈 debug
          navigate("/librarian-dashboard");
        } else {
          console.log("Redirecting to reader dashboard..."); // 👈 debug
          navigate("/reader-dashboard");
        }
      } else {
        setErrors({ general: data.error || "Login failed" });
      }
    } catch (err) {
      setErrors({ general: "Something went wrong" });
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="card auth-card shadow">
        <div className="card-body p-4 p-sm-5">
          {user ? (
            <div className="text-center py-4">
              <div className="display-3 text-info mb-3">✓</div>
              <h4 className="auth-title mb-2">Session Active</h4>
              <p className="auth-subtitle mb-4">
                Logged in securely as <strong>{user.full_name}</strong>
              </p>

              {user.is_librarian ? (
                <button
                  className="btn btn-dark w-100"
                  onClick={() => navigate("/librarian-dashboard")}
                >
                  Go to Librarian Console →
                </button>
              ) : (
                <button
                  className="btn btn-dark w-100"
                  onClick={() => navigate("/reader-dashboard")}
                >
                  Go to Books Catalog →
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="text-center mb-4">
                <h3 className="auth-title mb-1">Welcome Back</h3>
                <p className="auth-subtitle">
                  Sign in to access your digital library space
                </p>
              </div>

              {errors.general && (
                <div className="alert alert-danger">{errors.general}</div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    name="username"
                    className="form-control"
                    placeholder="Enter your username..."
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="Enter your password..."
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-dark w-100 mt-3">
                  Sign In
                </button>
              </form>

              <div className="text-center mt-4">
                <p className="text-dark small mb-0">
                  New to the platform?{" "}
                  <span
                    className="fw-bold"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/register")}
                  >
                    Create account
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

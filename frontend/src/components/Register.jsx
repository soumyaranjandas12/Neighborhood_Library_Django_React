import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    role: "READER",
    address: "",
    date_of_birth: "",
    contact_no: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirm_password) {
      return setError("Passwords do not match");
    }

    try {
      const res = await axiosInstance.post("api/register/", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setSuccess("Account created successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Registration failed",
      );
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="card auth-card shadow">
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <h3>Become a Reader</h3>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="full_name"
                className="form-control"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                className="form-control"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Role</label>
              <select
                name="role"
                className="form-select"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="READER">Reader</option>
                <option value="LIBRARIAN">Librarian</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Address</label>
              <textarea
                name="address"
                className="form-control"
                rows="3"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Phone No</label>
              <input
                type="text"
                name="contact_no"
                className="form-control"
                value={formData.contact_no}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Birth Date</label>
              <input
                type="date"
                name="date_of_birth"
                className="form-control"
                value={formData.date_of_birth}
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
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirm_password"
                className="form-control"
                value={formData.confirm_password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-dark w-100 mt-3">
              Register Profile
            </button>
          </form>

          <div className="text-center mt-3">
            <small>
              Already registered?{" "}
              <span
                style={{ cursor: "pointer" }}
                className="fw-bold"
                onClick={() => navigate("/login")}
              >
                Sign in here
              </span>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

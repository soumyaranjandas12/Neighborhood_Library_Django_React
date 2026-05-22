import React from "react";
import { useNavigate } from "react-router-dom";

const BookForm = ({ formData, setFormData, handleSubmit, errors = {} }) => {
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isUpdate = formData?.id ? true : false;

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <h3>{isUpdate ? "Update Record" : "Catalog New Asset"}</h3>
            <hr />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              noValidate
            >
              {/* Title */}
              <div className="mb-3">
                <label className="form-label fw-bold">Title</label>
                <input
                  type="text"
                  name="title"
                  className={`form-control ${errors.title ? "is-invalid" : ""}`}
                  value={formData.title || ""}
                  onChange={handleChange}
                />
                {errors.title && (
                  <div className="invalid-feedback">{errors.title}</div>
                )}
              </div>

              {/* Author */}
              <div className="mb-3">
                <label className="form-label fw-bold">Author</label>
                <input
                  type="text"
                  name="author"
                  className={`form-control ${errors.author ? "is-invalid" : ""}`}
                  value={formData.author || ""}
                  onChange={handleChange}
                />
                {errors.author && (
                  <div className="invalid-feedback">{errors.author}</div>
                )}
              </div>

              {/* Description (textarea like Django condition) */}
              <div className="mb-3">
                <label className="form-label fw-bold">Description</label>
                <textarea
                  name="description"
                  className={`form-control ${
                    errors.description ? "is-invalid" : ""
                  }`}
                  value={formData.description || ""}
                  onChange={handleChange}
                />
                {errors.description && (
                  <div className="invalid-feedback">{errors.description}</div>
                )}
              </div>

              {/* ISBN */}
              <div className="mb-3">
                <label className="form-label fw-bold">ISBN</label>
                <input
                  type="text"
                  name="isbn"
                  className={`form-control ${errors.isbn ? "is-invalid" : ""}`}
                  value={formData.isbn || ""}
                  onChange={handleChange}
                />
                {errors.isbn && (
                  <div className="invalid-feedback">{errors.isbn}</div>
                )}
              </div>

              {/* Published Date (special field) */}
              <div className="mb-3">
                <label className="form-label fw-bold">Published Date</label>
                <input
                  type="date"
                  name="published_date"
                  className={`form-control ${
                    errors.published_date ? "is-invalid" : ""
                  }`}
                  value={formData.published_date || ""}
                  onChange={handleChange}
                />
                {errors.published_date && (
                  <div className="invalid-feedback">
                    {errors.published_date}
                  </div>
                )}
              </div>

              {/* Example: Copies */}
              <div className="mb-3">
                <label className="form-label fw-bold">Available Copies</label>
                <input
                  type="number"
                  name="available_copies"
                  className={`form-control ${
                    errors.available_copies ? "is-invalid" : ""
                  }`}
                  value={formData.available_copies || ""}
                  onChange={handleChange}
                />
                {errors.available_copies && (
                  <div className="invalid-feedback">
                    {errors.available_copies}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="mt-4">
                <button type="submit" className="btn btn-success">
                  Save Record
                </button>

                <button
                  type="button"
                  className="btn btn-light border ms-2"
                  onClick={() => navigate("/librarian-dashboard")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookForm;

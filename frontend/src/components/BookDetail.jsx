import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../api/axios";

const BookDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [book, setBook] = useState(location.state?.book || null);
  const [loading, setLoading] = useState(!book);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        if (!book) {
          const res = await axiosInstance.get(`/api/book/${id}`);
          setBook(res.data);
        }
      } catch (error) {
        console.error("Error fetching book:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/api/books/${id}/`);
      navigate("/librarian-dashboard");
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!book) return <div className="text-center mt-5">Book not found</div>;

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-0 p-4">
        <div className="row">
          {/* LEFT SIDE */}
          <div className="col-md-8">
            <h1 className="display-5">{book.title}</h1>
            <p className="lead text-muted">Written by {book.author}</p>
            <hr />
            <h5>Description</h5>
            <p>{book.description || "No synopsis provided."}</p>
          </div>

          {/* RIGHT SIDE */}
          <div className="col-md-4 bg-light p-4 rounded border">
            <h5>Metadata Metrics</h5>
            <ul className="list-unstyled mt-3">
              <li className="mb-2">
                <strong>ISBN:</strong>{" "}
                <code className="text-dark">{book.isbn}</code>
              </li>
              <li className="mb-2">
                <strong>Published Date:</strong> {book.published_date}
              </li>
              <li className="mb-2">
                <strong>Total Inventory:</strong> {book.total_copies} units
              </li>
              <li className="mb-3">
                <strong>Available Capacity:</strong> {book.available_copies}{" "}
                units
              </li>
            </ul>

            {/* Librarian Actions */}
            {user?.role === "LIBRARIAN" && (
              <div className="d-grid gap-2 mt-4">
                <button
                  className="btn btn-warning"
                  onClick={() => navigate(`/book/edit/${book.id}`)}
                >
                  Edit Book
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete Book
                </button>
              </div>
            )}

            {/* Back Button */}
            <button
              className="btn btn-outline-secondary btn-sm w-100 mt-2"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;

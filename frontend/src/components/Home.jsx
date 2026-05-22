import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axios";

const Home = ({ user }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalIssuedCopies, setTotalIssuedCopies] = useState(0);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(0);
  const [pages, setPages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = 10;

  // ✅ FETCH BOOKS (Pagination + Search)
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);

        const res = await axiosInstance.get(
          `/api/books/?page=${page}&q=${query}`,
        );

        const data = res.data;

        setBooks(data.results.results || []);
        setTotalIssuedCopies(data.results.total_issued || 0);
        setTotalCount(data.count || 0);

        const pagesCount = Math.ceil((data.count || 0) / pageSize);
        setTotalPages(pagesCount);

        setPages(Array.from({ length: pagesCount }, (_, i) => i + 1));

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchBooks();
  }, [page, query]);

  // ✅ Reset page when searching
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
    }, 400);

    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="container py-5">
      {/* HEADER */}
      <div className="text-center mb-5 py-4">
        <h1 className="display-4 fw-extrabold text-dark mb-2">
          Welcome to Books Cafe
        </h1>
        <p className="text-muted fs-5 mx-auto" style={{ maxWidth: "600px" }}>
          Access library catalogs and track your reading seamlessly.
        </p>
      </div>

      {/* TOP CARDS */}
      <div className="row g-4 mb-5">
        {/* Browse */}
        <div className="col-md-4">
          <div
            className="card h-100 p-3 shadow-sm rounded-4"
            data-bs-toggle="collapse"
            data-bs-target="#booksPanel"
            style={{ cursor: "pointer" }}
          >
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <span className="display-5 mb-2 d-block">📚</span>
                <h4 className="fw-bold mb-1">Browse All Books</h4>
                <p className="text-muted small mb-0">
                  Browse collection, search titles, and issue copies.
                </p>
              </div>
              <div className="text-end mt-3">
                <span className="fs-2 text-primary">{totalCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Issued */}
        <div className="col-md-4">
          <Link
            to={
              user
                ? user.is_librarian
                  ? "/librarian-dashboard"
                  : "/reader-dashboard"
                : "/"
            }
            className="text-decoration-none"
          >
            <div className="card h-100 p-3 bg-dark text-white rounded-4">
              <div className="card-body d-flex flex-column justify-content-between">
                <div>
                  <span className="display-6">💳</span>
                  <h4>Total Issued Copies</h4>
                </div>
                <div className="text-end">
                  <span className="fs-2 text-warning">{totalIssuedCopies}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Workspace */}
        <div className="col-md-4">
          <Link
            to={
              user
                ? user.is_librarian
                  ? "/librarian-dashboard"
                  : "/reader-dashboard"
                : "/login"
            }
            className="text-decoration-none"
          >
            <div
              className="card h-100 p-3 text-white rounded-4"
              style={{
                background: user
                  ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                  : "linear-gradient(135deg,#7c3aed,#db2777)",
              }}
            >
              <div className="card-body d-flex flex-column justify-content-between">
                <div>
                  <span className="display-6">{user ? "⚡" : "🔒"}</span>
                  <h4>{user ? "Your Workspace" : "Login Required"}</h4>
                </div>
                <div>
                  {user ? (
                    <small>@{user.username}</small>
                  ) : (
                    <small>Login to continue</small>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* BOOK LIST */}
      <div className="collapse show" id="booksPanel">
        <div className="card p-4 shadow-sm rounded-4">
          {/* Search */}
          <div className="d-flex justify-content-between mb-4">
            <h4>Library</h4>
            <input
              type="search"
              className="form-control w-25"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Loading */}
          {loading ? (
            <div className="text-center py-5">
              <p>Loading books...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-5">
              <p>No books found 📭</p>
            </div>
          ) : (
            <>
              <div className="row g-4">
                {books.map((book) => (
                  <div className="col-md-4" key={book.id}>
                    <div className="card h-100 shadow-sm">
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex justify-content-between">
                          <h5 className="fw-bold">{book.title}</h5>
                          <span
                            className={`badge ${
                              book.available_copies > 0
                                ? "bg-success"
                                : "bg-danger"
                            }`}
                          >
                            {book.available_copies > 0 ? "In Stock" : "Out"}
                          </span>
                        </div>

                        <p className="text-muted small">By {book.author}</p>

                        <p className="flex-grow-1 small">
                          {book.description || "No description available"}
                        </p>

                        <div className="d-flex justify-content-between align-items-center mt-auto">
                          <small>ISBN: {book.isbn}</small>

                          <Link
                            to={user ? `/book/${book.id}` : "/login"}
                            className="btn btn-sm btn-outline-primary"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION */}
              <div className="d-flex justify-content-center mt-5 flex-wrap gap-2">
                {/* Prev */}
                <button
                  className="btn btn-outline-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Prev
                </button>

                <span>
                  Page {page} of {totalPages}
                </span>

                {/* Next */}
                <button
                  className="btn btn-outline-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;

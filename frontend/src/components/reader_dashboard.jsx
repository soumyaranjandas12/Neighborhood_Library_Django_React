import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import Navbar from "./navbar";
import { Link } from "react-router-dom";

const ReaderDashboard = ({ user }) => {
  const [books, setBooks] = useState([]);
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 10;
  const time = new Date().toLocaleTimeString();
  const [pages, setPages] = useState([]);
  const [openPanel, setOpenPanel] = useState(null);
  const [booksCount, setBooksCount] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [totalPagesHistory, setTotalPagesHistory] = useState(1);
  const [issuedHistoryCount, setIssuedHistoryCount] = useState(0);

  // 🔥 Helper (CSRF for Django)
  const getCSRFToken = () => {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
      ?.split("=")[1];
  };

  // 🔥 FETCH DATA
  useEffect(() => {
    fetchBooks();
    fetchHistory();
  }, [page, search, historyPage]);

  const fetchBooks = async () => {
    try {
      const res = await axiosInstance.get(
        `/api/books/?page=${page}&q=${search}`,
      );
      const data = res.data;
      setBooks(data.results.results || []); // fallback if no pagination
      const pagesCount = Math.ceil((data.count || 0) / pageSize);
      setTotalPages(pagesCount);
      setPages(Array.from({ length: pagesCount }, (_, i) => i + 1));
      setBooksCount(data.count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axiosInstance.get(
        `/api/reader/issue_history/?page=${historyPage}`,
      );

      const data = res.data || {};
      const totalPages = Math.ceil((data.count || 0) / pageSize);

      setTotalPagesHistory(totalPages);
      setIssuedHistoryCount(data.count || 0);
      setBorrowHistory(data.results.results || []); // ⚠️ fix here too
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between mb-4">
        <h2>Reader Dashboard</h2>
      </div>
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div
            className="card h-100 p-4 border-0 shadow-sm rounded-4 cursor-pointer transition-hover bg-white text-dark"
            data-bs-toggle="collapse"
            data-bs-target="#catalogDetailPanel"
            onClick={() => setOpenPanel("books")}
          >
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <span className="display-5 mb-2 d-block">📚</span>
                <h4 className="fw-bold mb-1">Browse All Books</h4>
                <p className="text-muted small mb-0">
                  Browse collection, search titles, and issue copies.
                </p>
              </div>
              <div className="text-end">
                <span className="display-6 fw-bold text-primary font-monospace">
                  {booksCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div
            className="card h-100 p-4 border-0 shadow-sm rounded-4 cursor-pointer transition-hover bg-success text-white"
            data-bs-toggle="collapse"
            data-bs-target="#issueHistoryPanel"
            onClick={() => setOpenPanel("history")}
          >
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <span className="display-5 mb-2 d-block">🕘</span>
                <h4 className="fw-bold mb-1 text-white">My Issue History</h4>
                <p className="text-white-50 small mb-0">
                  View your past and current book borrowings, due dates, and
                  return status.
                </p>
              </div>
              <div className="text-end">
                <span className="display-6 fw-bold text-warning font-monospace">
                  {issuedHistoryCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOOK PANEL ================= */}
      {openPanel === "books" && (
        <div className="collapse show" id="catalogDetailPanel">
          <div className="card p-4 shadow-sm rounded-4">
            {/* Search */}
            <div className="d-flex justify-content-between mb-4">
              <h4>Library</h4>
              <input
                type="search"
                className="form-control w-25"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {books.length === 0 ? (
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
                              {book.available_copies > 0
                                ? "In Stock"
                                : "Out Of Stock"}
                            </span>
                          </div>

                          <p className="text-muted small">By {book.author}</p>
                          <p className="text-muted small">
                            Available Copies: {book.available_copies}
                          </p>

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
                          <br />
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
      )}

      {/* ================= HISTORY ================= */}
      {openPanel === "history" && (
        <div className="collapse show" id="issueHistoryPanel">
          <div className="card p-3 mb-4">
            <div className="p-4 bg-light border-bottom">
              <h5 className="fw-bold text-dark mb-0">Book Issue History</h5>
            </div>
            <div className="p-4">
              <div className="row row-cols-1 row-cols-md-2 g-4">
                {borrowHistory.map(
                  (h) =>
                    h.user.username === user.username && (
                      <div className="col">
                        <div className="p-3 border rounded-4 bg-white shadow-sm transition-hover d-flex flex-column justify-content-between h-100">
                          <div>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6
                                className="fw-bold text-dark mb-0 text-truncate"
                                style={{ maxWidth: "70%" }}
                              >
                                {h.book.title}
                              </h6>
                              {new Date(h.due_date) > new Date() ? (
                                <span className="badge bg-success text-light font-monospace">
                                  Due: {h.due_date}
                                </span>
                              ) : (
                                <span className="badge bg-danger text-dark font-monospace">
                                  Due: {h.due_date}
                                </span>
                              )}
                            </div>

                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <span className="badge bg-light text-dark font-monospace">
                                Issued On: {h.issue_date}
                              </span>
                              {h.return_date ? (
                                <span className="badge bg-success text-light font-monospace">
                                  Returned On: {h.return_date}
                                </span>
                              ) : (
                                <span className="badge bg-light text-dark font-monospace">
                                  Not Returned Yet
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                )}
              </div>
              <br />
              {/* PAGINATION */}
              <div className="d-flex justify-content-between">
                <button
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage(historyPage - 1)}
                  className="btn btn-outline-dark"
                >
                  Prev
                </button>

                <span>
                  Page {historyPage} of {totalPagesHistory}
                </span>

                <button
                  disabled={historyPage === totalPagesHistory}
                  onClick={() => setHistoryPage(historyPage + 1)}
                  className="btn btn-outline-dark"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReaderDashboard;

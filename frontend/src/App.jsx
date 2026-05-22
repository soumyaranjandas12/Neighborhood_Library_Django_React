import Navbar from "./components/Navbar";
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import LibrarianDashboard from "./components/librarian_dashboard";
import ReaderDashboard from "./components/reader_dashboard";
import BookDetail from "./components/BookDetail";
import BookFormPage from "./components/BookFormPage";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route
          path="/login"
          element={<Login user={user} setUser={setUser} />}
        />
        <Route path="/register" element={<Register />} />
        <Route
          path="/librarian-dashboard"
          element={<LibrarianDashboard user={user} />}
        />
        <Route
          path="/reader-dashboard"
          element={<ReaderDashboard user={user} />}
        />
        <Route path="/book/:id" element={<BookDetail user={user} />} />
        <Route path="/create-book" element={<BookFormPage />} />
        <Route path="/book/edit/:id" element={<BookFormPage />} />
      </Routes>
    </>
  );
}

export default App;

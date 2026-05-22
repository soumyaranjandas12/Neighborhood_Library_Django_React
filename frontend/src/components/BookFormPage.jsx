import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axios";
import { useNavigate, useParams } from "react-router-dom";
import BookForm from "../page/BookForm";

const BookFormPage = () => {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    published_date: "",
    available_copies: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { id } = useParams(); // for update

  // ✅ Fetch existing book (UPDATE case)
  useEffect(() => {
    if (id) {
      axiosInstance
        .get(`api/books/${id}/`)
        .then((res) => {
          setFormData(res.data);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [id]);

  // ✅ Submit handler (CREATE + UPDATE)
  const handleSubmit = async () => {
    try {
      if (id) {
        // UPDATE
        await axiosInstance.put(`api/books/${id}/`, formData);
      } else {
        // CREATE
        await axiosInstance.post("api/books/", formData);
      }

      navigate("/librarian-dashboard");
    } catch (err) {
      console.log(err.response?.data);

      // Django DRF error format
      if (err.response?.data) {
        setErrors(err.response.data);
      }
    }
  };

  return (
    <BookForm
      formData={formData}
      setFormData={setFormData}
      handleSubmit={handleSubmit}
      errors={errors}
    />
  );
};

export default BookFormPage;

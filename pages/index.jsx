import React, { useState } from "react";
import Tesseract from "tesseract.js";

export default function Home() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");
  const [ddc, setDdc] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setImage(URL.createObjectURL(file));
  };

  const handleOCR = async () => {
    if (!image) return alert("Please upload an image first!");

    setLoading(true);
    setText("");
    setDdc("");
    setReason("");

    try {
      const result = await Tesseract.recognize(image, "eng", {
        logger: (m) => console.log(m),
      });
      setText(result.data.text);
    } catch (error) {
      alert("OCR failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClassify = async () => {
    if (!text.trim()) return alert("Please enter or edit text before classifying.");
    setClassifying(true);
    setDdc("");
    setReason("");

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (data.ddc) setDdc(data.ddc);
      if (data.reason) setReason(data.reason);
    } catch (error) {
      console.error("Error calling /api/classify:", error);
      setDdc("Error connecting to classifier.");
    } finally {
      setClassifying(false);
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "700px",
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>📘 DDC Chat Classifier</h1>

      <div style={{ textAlign: "center" }}>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {image && (
          <div style={{ margin: "1rem" }}>
            <img
              src={image}
              alt="Uploaded"
              width="250"
              style={{ borderRadius: "8px", boxShadow: "0 0 10px #ccc" }}
            />
          </div>
        )}

        <button
          onClick={handleOCR}
          disabled={loading}
          style={{
            background: "#0070f3",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {loading ? "Extracting text..." : "Run OCR"}
        </button>
      </div>

      <div style={{ marginTop: "1.5rem"

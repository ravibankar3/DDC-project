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
    <div style={{ padding: "2rem", textAlign: "center", maxWidth: 650, margin: "0 auto" }}>
      <h1>📘 DDC Classifier OCR</h1>

      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {image && (
        <div style={{ margin: "1rem" }}>
          <img src={image} alt="Uploaded" width="250" />
        </div>
      )}

      <button onClick={handleOCR} disabled={loading}>
        {loading ? "Extracting text..." : "Run OCR"}
      </button>

      <div style={{ marginTop: "1.5rem", textAlign: "left" }}>
        <h3>📝 Extracted Text (Editable):</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "1rem",
            fontFamily: "monospace",
          }}
          placeholder="Extracted text will appear here..."
        />

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <button onClick={handleClassify} disabled={classifying || !text.trim()}>
            {classifying ? "Classifying..." : "Classify DDC"}
          </button>
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <h3>📚 DDC Classification Result:</h3>
          {classifying ? (
            <p>Analyzing...</p>
          ) : (
            <>
              <p style={{ fontSize: "1.2rem" }}>
                <strong>DDC:</strong> {ddc || "—"}
              </p>
              <p>
                <strong>Reason:</strong> {reason || "No explanation yet."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

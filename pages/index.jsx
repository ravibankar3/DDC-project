import React, { useState } from "react";
import Tesseract from "tesseract.js";

export default function Home() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");
  const [classification, setClassification] = useState("");
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
    setClassification("");

    try {
      const result = await Tesseract.recognize(image, "eng", {
        logger: (m) => console.log(m),
      });
      const extractedText = result.data.text;
      setText(extractedText);
      await handleClassify(extractedText); // automatically call DDC classification
    } catch (error) {
      alert("OCR failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClassify = async (extractedText) => {
    if (!extractedText) return;
    setClassifying(true);

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });

      const data = await response.json();
      setClassification(data.classification || "No result");
    } catch (error) {
      console.error("Error calling /api/classify:", error);
      setClassification("Error connecting to classifier.");
    } finally {
      setClassifying(false);
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>📘 DDC Chatbot</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {image && <img src={image} alt="preview" width="200" />}
      <div style={{ marginTop: "1rem" }}>
        <button onClick={handleOCR} disabled={loading}>
          {loading ? "Extracting text..." : "Run OCR + Classify"}
        </button>
      </div>

      <div style={{ marginTop: "1.5rem", textAlign: "left" }}>
        <h3>📝 Extracted Text:</h3>
        <p style={{ whiteSpace: "pre-wrap" }}>{text}</p>

        <h3>📚 DDC Classification:</h3>
        <p>
          {classifying
            ? "Classifying..."
            : classification || "No classification yet."}
        </p>
      </div>
    </div>
  );
}

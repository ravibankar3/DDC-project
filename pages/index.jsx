import React, { useState } from "react";
import Tesseract from "tesseract.js";

export default function Home() {
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handleOCR = async () => {
    if (!image) {
      alert("Please upload an image first!");
      return;
    }

    setLoading(true);
    setText("");

    try {
      const { data } = await Tesseract.recognize(image, "eng", {
        logger: (m) => console.log(m),
      });

      setText(data.text);
    } catch (error) {
      console.error("OCR Error:", error);
      alert("OCR failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>📘 DDC Chatbot</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {image && <img src={image} alt="uploaded" width="200" />}
      <div style={{ marginTop: "1rem" }}>
        <button onClick={handleOCR} disabled={loading}>
          {loading ? "Extracting..." : "Run OCR"}
        </button>
      </div>
      <div style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
        <h3>OCR Text:</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

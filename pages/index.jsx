import React, { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';

export default function Home() {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handleExtractText = async () => {
    if (!image) return;
    setLoading(true);
    setText('');

    try {
      const result = await Tesseract.recognize(image, 'eng', {
        logger: (info) => console.log(info), // Optional progress logging
      });
      setText(result.data.text);
    } catch (error) {
      alert(`OCR failed: ${error.message}`);
      console.error('OCR error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>📘 DDC Chatbot</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {image && <img src={image} alt="preview" width="200" />}
      <div>
        <button onClick={handleExtractText} disabled={loading}>
          {loading ? 'Processing...' : 'Run OCR'}
        </button>
      </div>
      <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
        <h3>OCR Text</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

\
import React, { useRef, useState } from 'react';
import Tesseract from 'tesseract.js';

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useOpenAI, setUseOpenAI] = useState(true);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStreaming(true);
    } catch (err) {
      alert('Camera access denied or not available: ' + err.message);
    }
  }
  function stopCamera() {
    const stream = videoRef.current && videoRef.current.srcObject;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
      setStreaming(false);
    }
  }
  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setImageDataUrl(dataUrl);
    stopCamera();
  }
  function onUploadChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result);
    reader.readAsDataURL(file);
  }
  async function runOCR() {
    if (!imageDataUrl) return alert('No image');
    setLoading(true);
    setOcrText('');
    setResult(null);
    try {
      const worker = Tesseract.createWorker({ logger: m => console.log(m) });
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data } = await worker.recognize(imageDataUrl);
      setOcrText(data.text);
      await worker.terminate();
    } catch (err) {
      console.error(err);
      alert('OCR failed: ' + err.message);
    }
    setLoading(false);
  }
  async function classify() {
    if (!ocrText) return alert('Run OCR first');
    setLoading(true);
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ocrText, useOpenAI })
      });
      const j = await res.json();
      setResult(j);
    } catch (err) {
      console.error(err);
      alert('Classification failed: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16, fontFamily: 'sans-serif' }}>
      <h1>DDC Chatbot</h1>
      <div style={{ marginBottom: 12 }}>
        <button onClick={startCamera} disabled={streaming} style={{ marginRight: 8 }}>Start Camera</button>
        <button onClick={capture} disabled={!streaming} style={{ marginRight: 8 }}>Capture</button>
        <button onClick={stopCamera} disabled={!streaming}>Stop</button>
      </div>
      <video ref={videoRef} style={{ width: '100%', maxHeight: 400, background: '#000' }} hidden={!streaming} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ marginTop: 12 }}>
        <label>Or upload image</label>
        <input type="file" accept="image/*" onChange={onUploadChange} />
      </div>
      {imageDataUrl && <div style={{ marginTop: 12 }}><img src={imageDataUrl} alt="preview" style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }} /></div>}

      <div style={{ marginTop: 12 }}>
        <button onClick={runOCR} disabled={loading || !imageDataUrl} style={{ marginRight: 8 }}>Run OCR</button>
        <button onClick={classify} disabled={loading || !ocrText}>Classify (DDC)</button>
        <label style={{ marginLeft: 12 }}>
          <input type="checkbox" checked={useOpenAI} onChange={(e) => setUseOpenAI(e.target.checked)} /> Use OpenAI for mapping
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <h3>OCR Text</h3>
        <textarea value={ocrText} onChange={(e) => setOcrText(e.target.value)} rows={6} style={{ width: '100%' }} />
      </div>

      <div style={{ marginTop: 12 }}>
        <h3>Result</h3>
        {loading && <div>Working…</div>}
        {result && (
          <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
            <div><strong>Suggested DDC:</strong> {result.ddc || '—'}</div>
            <div><strong>Label:</strong> {result.label || '—'}</div>
            <div><strong>Confidence:</strong> {result.confidence ?? 'n/a'}</div>
            <div style={{ marginTop: 8 }}><strong>Notes</strong><pre style={{ whiteSpace: 'pre-wrap' }}>{result.rationale || result.match || JSON.stringify(result, null, 2)}</pre></div>
          </div>
        )}
      </div>

      <footer style={{ marginTop: 16, fontSize: 12, color: '#666' }}>Created by Dr. R. S. Bankar — Client-side OCR via Tesseract.js. For privacy, disable Use OpenAI to avoid sending OCR text to external API.</footer>
    </div>
  );
}

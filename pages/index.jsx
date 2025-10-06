const handleOCR = async () => {
  if (typeof window === "undefined") {
    alert("OCR is only supported in the browser.");
    return;
  }

  if (!image) {
    alert("Please upload an image first!");
    return;
  }

  setLoading(true);
  setText("");
  setDdc("");
  setReason("");

  try {
    // Import tesseract dynamically so it only runs in the browser
    const { createWorker } = await import("tesseract.js");

    const worker = await createWorker("eng");
    const result = await worker.recognize(image);
    setText(result.data.text);
    await worker.terminate();
  } catch (error) {
    console.error("OCR failed:", error);
    alert("OCR failed: " + error.message);
  } finally {
    setLoading(false);
  }
};

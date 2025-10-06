export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing text input" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: `
You are a librarian trained in Dewey Decimal Classification (DDC). 
Read the following text and give:
1️⃣ The best DDC number (3 digits preferred).  
2️⃣ A short reason explaining your choice in plain English.

Text:
${text}

Respond in this exact format:
DDC: [number]
Reason: [explanation]
        `,
        max_tokens: 150,
        temperature: 0.4,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return res
        .status(500)
        .json({ error: "OpenAI API error: " + data.error.message });
    }

    const output = data.choices?.[0]?.text?.trim() || "No response";
    let ddc = "Not found";
    let reason = "No explanation given.";

    // Parse model response
    const ddcMatch = output.match(/DDC:\s*([0-9.]+)/i);
    const reasonMatch = output.match(/Reason:\s*(.+)/i);
    if (ddcMatch) ddc = ddcMatch[1];
    if (reasonMatch) reason = reasonMatch[1];

    return res.status(200).json({ ddc, reason, raw: output });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

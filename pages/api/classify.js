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
        prompt: `Provide the Dewey Decimal Classification (DDC) number for this text:\n\n${text}\n\nDDC:`,
        max_tokens: 50,
        temperature: 0,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return res
        .status(500)
        .json({ error: "OpenAI API error: " + data.error.message });
    }

    const classification =
      data.choices?.[0]?.text?.trim() || "No DDC classification found";

    return res.status(200).json({ classification });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

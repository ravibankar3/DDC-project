export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing text input" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a professional librarian trained in Dewey Decimal Classification (DDC). Always respond in JSON format.",
          },
          {
            role: "user",
            content: `
Classify the following text into Dewey Decimal Classification.
Return only a JSON object with:
{
  "ddc": "[the most relevant DDC number, e.g. 170]",
  "reason": "[a short reason why it fits this number]"
}

Text to classify:
${text}
`,
          },
        ],
        temperature: 0.2,
        max_tokens: 200,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return res
        .status(500)
        .json({ error: "OpenAI API error: " + data.error.message });
    }

    const message = data.choices?.[0]?.message?.content || "{}";

    let parsed = {};
    try {
      parsed = JSON.parse(message);
    } catch {
      console.warn("Could not parse JSON, using raw text fallback.");
      parsed = { ddc: "Unknown", reason: message };
    }

    return res.status(200).json({
      ddc: parsed.ddc || "No DDC found",
      reason: parsed.reason || "No explanation returned.",
    });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

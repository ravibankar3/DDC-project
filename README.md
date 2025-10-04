# DDC Chatbot (by Dr. R. S. Bankar)

This is a Vercel-ready Next.js project (client + serverless API) that performs client-side OCR (Tesseract.js) and a serverless classification API that can use a local DDC map or call OpenAI (gpt-4o-mini) for suggestions.

**Creator metadata:** Dr. R. S. Bankar

## Quick deploy to Vercel
1. Create a new Git repository and push this project, or use Vercel's Upload feature.
2. Go to https://vercel.com/new and import the repository or upload the ZIP.
3. In Vercel project settings -> Environment Variables add:
   - `OPENAI_API_KEY` = your OpenAI API key (if you want OpenAI mapping enabled)
4. Deploy — Vercel will build and publish at a URL like `https://<your-project>.vercel.app`.

## Notes
- The included DDC dataset (`/data/ddc_full.json`) is generated programmatically for coverage (000-999) but is **not** an authoritative DDC dataset. For production, replace with an official DDC dataset or library source.
- For privacy, disable the "Use OpenAI" toggle in the UI to keep OCR text local.


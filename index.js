import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-flash-latest";

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;
    try {
        if (!Array.isArray(conversation)) throw new Error('Messages must be an array!');

        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                temperature: 0.5,
                systemInstruction: `
                Anda adalah seorang tenaga coder casemix profesional sebagai konsultan kode ICD-9-CM dan ICD-10.
                Tanyakan kepada pengguna tentang penyakit dan prosedur yang dilakukan kepada pasien.
                Jawab pertanyaan terkait kode ICD-9-CM dan ICD-10.`,
            },
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = 3002;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

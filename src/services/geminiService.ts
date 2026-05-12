import { GoogleGenerativeAI as GoogleGenAI, SchemaType as Type } from "@google/generative-ai";
import { NORWEGIAN_FLOWERS } from "../data/flowers";

let ai: GoogleGenAI | null = null;

export interface IdentifiedFlower {
  id?: string;
  name?: string;
  scientificName?: string;
  family?: string;
  description?: string;
  habitat?: string;
  rarity?: 'common' | 'rare' | 'ghost' | 'unknown';
  isMatch?: boolean;
  error?: string;
  formattedText?: string;
}

const SYSTEM_INSTRUCTION = `Du er en botanikk-ekspert som leverer data til en plante-app. Brukeren skal få nøyaktig samme informasjon enten de skanner en ny blomst eller henter informasjon om en plante fra sin "Samling".

For å passe til appens design skal ALLTID teksten du genererer følge denne strukturen:

**Navn:** [Norsk Navn]
**Latinsk navn:** [Vitenskapelig navn i kursiv]
**Familie:** [Plante-familien i store bokstaver, f.eks. KURVPLANTEFAMILIEN]
**Sjeldenhetsgrad:** [Angi om planten er COMMON, UNCOMMON eller RARE]

**HABITAT:**
[Kort beskrivelse av hvor den vokser, f.eks. "Kulturmark, hager og avfallsplasser"]

**STATUS:**
[Nåværende status i Norge, f.eks. "I blomst", "Vinterdvale" eller "Spirende"]

**FELTGUIDE:**
[En informativ tekst på 3-4 setninger om plantens kjennetegn, historie eller slektskap. Start gjerne med å nevne slekten den tilhører.]

Språk: Norsk. 
Tone: Saklig, lærerik og profesjonell.`;

function getAI() {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("VITE_GEMINI_API_KEY is missing");
      return null;
    }
    ai = new GoogleGenAI(apiKey);
  }
  return ai;
}

export async function generateFlowerText(speciesName: string): Promise<string | null> {
  const currentAi = getAI();
  if (!currentAi) {
    console.error("Gemini AI er ikke initialisert.");
    return null;
  }

  try {
    const prompt = `Generer informasjonen for planten "${speciesName}".
Du MÅ følge systeminstruksen nøyaktig og fylle ut alle felt.`;

    const model = currentAi.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
      }
    });

    return result.response.text() || null;
  } catch (error) {
    console.error("Feil ved generering av plantetekst:", error);
    return null;
  }
}

export async function identifyFlower(base64Image: string, mimeType: string): Promise<IdentifiedFlower | null> {
  const currentAi = getAI();
  if (!currentAi) return null;

  try {
    // Strip base64 prefix if present (e.g. "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const list = NORWEGIAN_FLOWERS.map(f => `${f.id} (${f.name} - ${f.scientificName})`).join(', ');

    const prompt = `Analyze this image and identify the flower. You must respond ONLY with a valid JSON object containing these keys: "navn" (the common Norwegian name of the flower), "vitenskapeligNavn" (the Latin scientific name), and "beskrivelse" (a short, fun 2-sentence description of the flower in Norwegian).`;

    const model = currentAi.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType
            }
          },
          { text: prompt }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["navn", "vitenskapeligNavn", "beskrivelse"],
          properties: {
            navn: { type: Type.STRING, description: "The common Norwegian name of the flower" },
            vitenskapeligNavn: { type: Type.STRING, description: "The Latin scientific name" },
            beskrivelse: { type: Type.STRING, description: "A short, fun 2-sentence description of the flower in Norwegian" }
          }
        }
      }
    });

    const text = result.response.text();
    if (!text) {
      console.error("Empty response from Gemini");
      return null;
    }

    try {
      // Clean up potential markdown code blocks just in case
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanedText) as IdentifiedFlower;
    } catch (parseError) {
      console.error("JSON parsing error:", parseError, "Raw text:", text);
      return null;
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

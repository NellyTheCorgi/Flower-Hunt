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

    const prompt = `Vennligst analyser dette bildet og identifiser planten.
    Sjekk spesielt om den matcher en av disse fra vår database (ID: Navn - Vitenskapelig navn):
    [${list}]
    
    Hvis planten er en match (eller en svært nær slektning på listen), sett 'isMatch' til true og oppgi 'id' fra listen.
    Hvis planten ikke er på listen, identifiser den likevel så nøyaktig som mulig.
    Du MÅ i tillegg fylle ut feltet 'formattedText' nøyaktig slik det er beskrevet i systeminstruksjonen.`;

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
          required: ["name", "scientificName", "family", "description", "habitat", "rarity", "isMatch", "formattedText"],
          properties: {
            name: { type: Type.STRING, description: "Norsk navn på arten" },
            scientificName: { type: Type.STRING, description: "Latinsk navn" },
            family: { type: Type.STRING, description: "Botanisk familie (på norsk)" },
            description: { type: Type.STRING, description: "Kort botanisk beskrivelse (ca 2 setninger)" },
            habitat: { type: Type.STRING, description: "Hvor planten typisk vokser" },
            rarity: { type: Type.STRING, enum: ['common', 'rare', 'ghost'], description: "Sjeldenhet" } as any,
            isMatch: { type: Type.BOOLEAN, description: "Er dette en direkte match med listen?" },
            id: { type: Type.STRING, description: "ID fra listen hvis match" },
            error: { type: Type.STRING, description: "Feilmelding hvis ingen plante ble funnet" },
            formattedText: { type: Type.STRING, description: "Den nøyaktig formaterte teksten beskrevet i systeminstruksjonen" }
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

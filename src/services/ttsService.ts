import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface TTSOptions {
  text: string;
  voiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' | 'Algieba' | 'Algenib';
  temperature?: number;
  topP?: number;
  speed?: number;
  pitch?: number;
}

export async function generateTTSSpeech(options: TTSOptions) {
  const { text, voiceName = 'Algieba', temperature = 0.85, topP = 0.95, speed = 1.0, pitch = 1.0 } = options;

  // Personas instructions integrated into the prompt or system instruction
  const personaPrompt = `أنت يوتيوبر عربي كاريزمي. صوتك طبيعي 100%، إنساني، وحيوي.
لا تستخدم الأسلوب الآلي. استخدم لغة عربية فصحى سلسة وقريبة من الجمهور.
النبرة: دافئة، جذابة، ومليئة بالحيوية.
استخدم تعابير مثل: "أصدقائي"، "كما ترون"، "دعونا نبدأ"، "ما رأيكم؟"، "تابعوا معي".
انطق الأرقام بوضوح بالعربية الفصحى (مثال: 11 هو أحد عشر).
العملات: استخدم "درهم" أو العملة المناسبة.

انطق النص التالي بأسلوبك الكاريزمي:
${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: personaPrompt }] }],
      config: {
        temperature,
        topP,
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("لم يتم إنشاء الصوت بنجاح.");
    }

    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
}

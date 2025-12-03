import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTestCases = async (featureDescription: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Atue como um Engenheiro de QA Senior.
      Com base na seguinte descrição de funcionalidade: "${featureDescription}",
      Gere uma lista de 3 a 5 casos de teste estruturados.
      
      Retorne APENAS um array JSON válido (sem markdown block) com o seguinte formato para cada item:
      {
        "title": "Título do caso",
        "preconditions": "Pré-condições",
        "steps": "Passos para execução",
        "expectedResult": "Resultado esperado"
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return response.text || "[]";
  } catch (error) {
    console.error("Error generating test cases:", error);
    throw error;
  }
};

export const improveBuildDoc = async (currentContent: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Atue como um Engenheiro DevOps Senior.
      Melhore e formate a seguinte documentação de build para torná-la mais clara, profissional e estruturada (use Markdown):
      
      "${currentContent}"
      
      Mantenha as informações técnicas precisas, apenas melhore a clareza e estrutura.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || currentContent;
  } catch (error) {
    console.error("Error improving documentation:", error);
    throw error;
  }
};

export const improveDocumentation = async (currentContent: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Atue como um Technical Writer Senior.
      Melhore e formate a seguinte documentação para torná-la mais clara, profissional e estruturada (use Markdown):
      
      "${currentContent}"
      
      Mantenha as informações técnicas precisas, apenas melhore a clareza, gramática e estrutura.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || currentContent;
  } catch (error) {
    console.error("Error improving documentation:", error);
    throw error;
  }
};

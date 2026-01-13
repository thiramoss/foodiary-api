import OpenAI, { toFile } from 'openai';

// 1. Configuração do Client apontando para a Groq
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY, // Certifique-se de ter essa var de ambiente
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function transcribeAudio(fileBuffer: Buffer) {
  const transcription = await client.audio.transcriptions.create({
    // 2. Modelo Whisper da Groq (versão large-v3 é a recomendada para multilinguagem)
    model: 'whisper-large-v3', 
    language: 'pt',
    response_format: 'text',
    file: await toFile(fileBuffer, 'audio.m4a', { type: 'audio/m4a' }),
  });

  return transcription;
}

type GetMealDetailsFromTextParams = {
  text: string;
  createdAt: Date;
}

export async function getMealDetailsFromText({
  createdAt,
  text,
}: GetMealDetailsFromTextParams) {
  const response = await client.chat.completions.create({
    // 3. Modelo de texto rápido e inteligente (Llama 3.3 70B é excelente para instruções complexas)
    model: 'llama-3.3-70b-versatile',
    // 4. Forçar JSON Mode é essencial na Groq para garantir a estrutura
    response_format: { type: "json_object" }, 
    messages: [
      {
        role: 'system',
        content: `
          Você é um nutricionista e está atendendo um de seus pacientes.
          
          IMPORTANTE: A resposta deve ser estritamente um JSON válido.
          
          Seu papel é:
          1. Dar um nome e escolher um emoji para a refeição baseado no horário dela.
          2. Identificar os alimentos presentes na imagem.
          3. Estimar, para cada alimento identificado:
            - Nome do alimento (em português)
            - Quantidade aproximada (em gramas ou unidades)
            - Calorias (kcal)
            - Carboidratos (g)
            - Proteínas (g)
            - Gorduras (g)

          Seja direto, objetivo e evite explicações. Apenas retorne os dados em JSON no formato abaixo:

          {
            "name": "Jantar",
            "icon": "🍗",
            "foods": [
              {
                "name": "Arroz branco cozido",
                "quantity": "150g",
                "calories": 193,
                "carbohydrates": 42,
                "proteins": 3.5,
                "fats": 0.4
              }
            ]
          }
        `,
      },
      {
        role: 'user',
        content: `
          Data: ${createdAt}
          Refeição: ${text}
        `,
      },
    ],
  });

  const json = response.choices[0]?.message?.content;

  if (!json) {
    throw new Error('Failed to process meal.');
  }

  return JSON.parse(json);
}

type GetMealDetailsFromImageParams = {
  imageURL: string;
  createdAt: Date;
}

export async function getMealDetailsFromImage({
  createdAt,
  imageURL,
}: GetMealDetailsFromImageParams) {
  const response = await client.chat.completions.create({
    // 5. Modelo de Visão da Groq (Llama 3.2 Vision)
    model: 'llama-3.2-90b-vision-preview', 
    response_format: { type: "json_object" },
    messages: [
      {
        role: 'system',
        content: `
          Meal date: ${createdAt}

          Você é um nutricionista especializado em análise de alimentos por imagem.
          IMPORTANTE: A resposta deve ser estritamente um JSON válido.

          Seu papel é:
          1. Dar um nome e escolher um emoji para a refeição baseado no horário dela.
          2. Identificar os alimentos presentes na imagem.
          3. Estimar macros (calorias, carbos, proteínas, gorduras).

          Retorne APENAS o JSON no formato:
          {
            "name": "Jantar",
            "icon": "🍗",
            "foods": [...]
          }
        `,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageURL,
            },
          },
        ],
      },
    ],
  });

  const json = response.choices[0]?.message?.content;

  if (!json) {
    throw new Error('Failed to process meal.');
  }

  return JSON.parse(json);
}
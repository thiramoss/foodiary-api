import OpenAI, { toFile } from 'openai';

const client = new OpenAI();

export async function transcribeAudio(fileBuffer: Buffer) {
  const transcription = await client.audio.transcriptions.create({
    model: 'whisper-1',
    language: 'pt',
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
    model: 'gpt-4o-mini', 
    response_format: { type: 'json_object' }, 
    messages: [
      {
        role: 'system',
        content: `
          Você é um nutricionista. Analise o texto da refeição e retorne um JSON.
          Instruções:
          1. Nome e emoji da refeição conforme o horário.
          2. Identifique os alimentos citados no texto.
          3. Estime calorias, macros e quantidades.
          
          Responda estritamente em JSON seguindo este formato:
          {
            "name": "Jantar",
            "icon": "🍗",
            "foods": [
              {
                "name": "Arroz",
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
        content: `Data: ${createdAt}. Refeição: ${text}`,
      },
    ],
  });

  const content = response.choices[0]?.message.content;
  if (!content) throw new Error('Failed to process meal.');

  return JSON.parse(content);
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
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
          Você é um nutricionista. Analise a imagem e retorne um JSON com os alimentos identificados, 
          quantidades estimadas e valores nutricionais.
          Use a data/hora para definir o nome da refeição: ${createdAt}.
          
          Formato de saída: JSON (mesma estrutura da função de texto).
        `,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageURL },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message.content;
  if (!content) throw new Error('Failed to process image.');

  return JSON.parse(content);
}
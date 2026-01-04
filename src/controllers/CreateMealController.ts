import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "../db/index.js";
import { mealsTable } from "../db/schema.js";
import type { HttpResponse, ProtectedHttpRequest } from "../types/Http.js";
import { badRequest, ok } from "../utils/http.js";
import z from "zod";
import { randomUUID } from "crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../clients/s3Client.js";

const schema = z.object({
    fileType: z.enum(['audio/m4a', 'image/jpeg'])
})

export class CreateMealController {
    static async handle({ userId, body }: ProtectedHttpRequest): Promise<HttpResponse> {
        const { success, error, data } = schema.safeParse(body);

        if (!success) {
            return badRequest({ errors: error.issues });
        }

        const fileId = randomUUID();
        const ext = data.fileType === 'audio/m4a' ? '.m4a' : '.jpg';
        const fileKey = `${fileId}${ext}`;

        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: fileKey,
            ContentType: data.fileType,
        });

        const presignedURL = await getSignedUrl(s3Client, command, { expiresIn: 600});

        const [meal] = await db
            .insert(mealsTable)
            .values({
                userId,
                inputFileKey: 'input_file_key',
                inputType: data.fileType === 'audio/m4a' ? 'audio' : 'picture',
                status: 'uploading',
                icon: '',
                name: '',
                foods: [],
            }).returning({ id: mealsTable.id })

        if (!meal) {
            throw new Error("Failed to create meal record.");
        }

        return ok({ 
            mealId: meal.id,
            uploadURL: presignedURL,
        });
    }
}
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../db/index.js";
import { mealsTable } from "../db/schema.js";
import type { HttpResponse, ProtectedHttpRequest } from "../types/Http.js";
import { badRequest, ok } from "../utils/http.js";
import z from "zod";

const schema = z.object({
    date: z.iso.date().transform(dateStr => new Date(dateStr)),
});

export class ListMealsController {
    static async handle({ userId, queryParams }: ProtectedHttpRequest): Promise<HttpResponse> {
        const { success, error, data } = schema.safeParse(queryParams);

        if (!success) {
            return badRequest({ errors: error.issues });
        }

        const endDate = new Date(data.date);
        endDate.setUTCHours(23, 59, 59, 59); 

        const meals = await db.query.mealsTable.findMany({
            columns: {
                id: true,
                foods: true,
                createdAt: true,
                icon: true,
                name: true,
            },
            where: and(
                eq(mealsTable.userId, userId),
                eq(mealsTable.status, 'success'),
                gte(mealsTable.createdAt, data.date),
                lte(mealsTable.createdAt, endDate),
            ),
        });

        return ok({ meals });
    }
}
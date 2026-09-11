import { and, eq, gte, lte } from 'drizzle-orm';
import z from 'zod';
import { db } from '../db/index.js';
import { mealsTable } from '../db/schema.js';
import type { HttpResponse, ProtectedHttpRequest } from "../types/Http.js";
import { badRequest, ok } from "../utils/http.js";

// Validamos apenas o formato de string simples
const schema = z.object({
  date: z.string(),
});

export class ListMealsController {
  static async handle({ userId, queryParams }: ProtectedHttpRequest): Promise<HttpResponse> {
    const { success, error, data } = schema.safeParse(queryParams);
    
    if (!success) {
      return badRequest({ errors: error.issues });
    }

    const [yearStr, monthStr, dayStr] = data.date.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    // Definimos o início do dia no Brasil em UTC (00:00:00 BRT = 03:00:00 UTC)
    const startDate = new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0));

    // Definimos o fim do dia no Brasil em UTC (23:59:59.999 BRT = 02:59:59.999 UTC do dia seguinte)
    const endDate = new Date(Date.UTC(year, month - 1, day + 1, 2, 59, 59, 999));

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
        gte(mealsTable.createdAt, startDate),
        lte(mealsTable.createdAt, endDate),
      ),
    });

    return ok({ meals });
  }
}
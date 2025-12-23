import z from "zod";
import type { HttpRequest, HttpResponse } from "../types/Http.js";
import { badRequest, ok, unauthorized } from "../utils/http.js";
import { eq } from "drizzle-orm";
import { usersTable } from "../db/schema.js";
import { db } from "../db/index.js";
import { compare } from "bcryptjs";

const schema = z.object({
    email: z.email(),
    password: z.string().min(8),
})

export class SignInController {
    static async handle({ body }: HttpRequest): Promise<HttpResponse> {
        const { success, error, data } = schema.safeParse(body);

        if (!success) {
            return badRequest({ errors: error.issues });
        }

        const user = await db.query.usersTable.findFirst({
            columns: {
                id: true,
                email: true,
                password: true,
            },
            where: eq(usersTable.email, data.email),
        });

        if(!user) {
            return unauthorized({ error: 'Invalid credentials.'})
        }

        const isPasswordValid = await compare(data.password, user.password);

        if(!isPasswordValid) {
            return unauthorized({ error: 'Invalid credentials'});
        }
        return ok({
            user,
        })
    }

}
import z from "zod";
import type { HttpRequest, HttpResponse } from "../types/Http.js";
import { badRequest, conflict, created } from "../utils/http.js";
import { db } from "../db/index.js";
import { usersTable } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { signAccessTokenFor } from "../lib/jwt.js";
import { calculateGoals } from "../lib/calculateGoals.js";

const schema = z.object({
    goal: z.enum(['lose', 'maintain', 'gain']),
    gender: z.enum(['male', 'female']),
    birthDate: z.iso.date(),
    height: z.number(),
    weight: z.number(),
    activityLevel: z.number().min(1).max(5),
    account: z.object({
        name: z.string().min(1),
        email: z.email(),
        password: z.string().min(8)
    })
})

export class SignUpController {
    static async handle({ body }: HttpRequest): Promise<HttpResponse> {
        const { success, error, data } = schema.safeParse(body);

        if (!success) {
            return badRequest({ errors: error.issues });
        }

        const userAlreadyExists = await db.query.usersTable.findFirst({
            columns: {
                email: true,
            },
            where: eq(usersTable.email, data.account.email),
        });

        if (userAlreadyExists) {
            return conflict({ error: "This email is already in use" });
        }

        const { account, ...rest } = data;
        const goals = calculateGoals({
            activityLevel: rest.activityLevel,
            birthDate: new Date(rest.birthDate),
            gender: rest.gender,
            goal: rest.goal,
            height: rest.height,
            weight: rest.weight,
        });

        const hashedPassword = await hash(account.password, 10);

        const [user] = await db.insert(usersTable).values({
            ...account,
            ...rest,
            ...goals,
        })
            .returning({
                id: usersTable.id,
            })

        if (!user) {
            return badRequest({ error: "User creation failed" });
        }

        const accessToken = signAccessTokenFor(user.id);

        return created({
            accessToken
        })
    }
}
import type { HttpRequest, HttpResponse } from "../types/Http.js";
import { ok } from "../utils/http.js";

export class SignInController {
    static async handle(request: HttpRequest): Promise<HttpResponse> {
        return ok({
            accessToken: 'Sign in: Token de aecsso',
        })
    }
}
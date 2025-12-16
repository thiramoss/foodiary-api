import type { HttpRequest, HttpResponse } from "../types/Http.js";
import { created } from "../utils/http.js";

export class SignUpController {
    static async handle(request: HttpRequest): Promise<HttpResponse> {
        return created({
            accessToken: 'Sign up: Token de aecsso',
        })
    }
}
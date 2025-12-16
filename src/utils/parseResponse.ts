import type { HttpResponse } from "../types/Http.js";

export function parseResponse({statusCode, body}: HttpResponse) {
    return {
        statusCode,
        body: body ? JSON.stringify(body) : undefined,
    }
}
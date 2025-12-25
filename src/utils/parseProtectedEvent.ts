import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { ProtectedHttpRequest } from "../types/Http.js";
import { parseEvent } from "./parseEvent.js";
import { validateAccessToken } from "../lib/jwt.js";

export function parseProtectedEvent(event: APIGatewayProxyEventV2): ProtectedHttpRequest {
    const baseEvent = parseEvent(event);
    const { authorization } = event.headers;

    if (!authorization) {
        throw new Error('Access token not provided');
    }

    const token = authorization.split(' ')[1];

    if (!token) {
        throw new Error('Access token malformed');
    }

    const userId = validateAccessToken(token);

    if(!userId) {
        throw new Error('Invalid access token.');
    }

    return {
       ...baseEvent,
       userId,
    };
}
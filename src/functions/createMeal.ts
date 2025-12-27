import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import { CreateMealController } from "../controllers/CreateMealController.js";
import { parseResponse } from '../utils/parseResponse.js';
import { parseProtectedEvent } from '../utils/parseProtectedEvent.js';
import { unauthorized } from '../utils/http.js';

export async function handler(event: APIGatewayProxyEventV2) {
    try {
        const request = parseProtectedEvent(event);
        const response = await CreateMealController.handle(request);
        return parseResponse(response);
    } catch (error) {
        return parseResponse(unauthorized({ error: 'Invalid access token'}))
        ;
    }


}
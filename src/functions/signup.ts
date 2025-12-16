import  type { APIGatewayProxyEventV2 } from 'aws-lambda';

import { SignUpController } from "../controllers/SignUpController.js";
import { parseEvent } from "../utils/parseEvent.js";
import { parseResponse } from '../utils/parseResponse.js';

export async function handler(event: APIGatewayProxyEventV2){
    const request = parseEvent(event);


    const response = await SignUpController.handle(request);
    return parseResponse(response);
}
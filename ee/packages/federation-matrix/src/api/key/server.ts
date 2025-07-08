import type { Router } from "@rocket.chat/http-router";
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';
import { getAllServicesFromFederationSDK } from "../../setupContainers";

const ServerKeyResponseSchema = {
    type: 'object',
    properties: {
        old_verify_keys: {
            type: 'object',
            additionalProperties: true,
            description: 'Old verification keys'
        },
        server_name: {
            type: 'string',
            description: 'Matrix server name'
        },
        signatures: {
            type: 'object',
            additionalProperties: true,
            description: 'Server signatures'
        },
        valid_until_ts: {
            type: 'number',
            minimum: 0,
            description: 'Unix timestamp in milliseconds'
        },
        verify_keys: {
            type: 'object',
            additionalProperties: {
                type: 'object',
                properties: {
                    key: {
                        type: 'string',
                        description: 'Base64-encoded public key'
                    }
                },
                required: ['key'],
                additionalProperties: false
            },
            description: 'Current verification keys'
        }
    },
    required: ['old_verify_keys', 'server_name', 'signatures', 'valid_until_ts', 'verify_keys'],
    additionalProperties: false
};

const isServerKeyResponseProps = ajv.compile(ServerKeyResponseSchema);

export const getKeyServerRoutes = (router: Router<'/key'>) => {
    const { server } = getAllServicesFromFederationSDK();
    
    return router.get('/v2/server', {
        response: {
            200: isServerKeyResponseProps
        },
        tags: ['Key'],
        license: ['federation']
    }, async () => {
        const response = await server.getSignedServerKey();

        return {
            body: response,
            statusCode: 200,
        };
    });
};

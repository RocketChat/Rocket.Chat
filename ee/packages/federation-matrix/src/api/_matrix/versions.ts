import type { Router } from "@rocket.chat/http-router";
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';
import { ConfigService } from '@hs/federation-sdk';

const GetVersionsResponseSchema = {
    type: 'object',
    properties: {
        server: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Server software name'
                },
                version: {
                    type: 'string',
                    description: 'Server software version'
                }
            },
            required: ['name', 'version'],
            additionalProperties: false
        }
    },
    required: ['server'],
    additionalProperties: false
};

const isGetVersionsResponseProps = ajv.compile(GetVersionsResponseSchema);

export const getFederationVersionsRoutes = (router: Router<'/_matrix'>) => {
    const configService = new ConfigService();
    
    return router.get('/federation/v1/version', {
        response: {
            200: isGetVersionsResponseProps
        },
        tags: ['Federation'],
        license: ['federation']
    }, async () => {
        const config = configService.getServerConfig();
        
        const response = {
            server: {
                name: config.name,
                version: config.version,
            },
        };

        return {
            body: response,
            statusCode: 200,
        };
    });
};

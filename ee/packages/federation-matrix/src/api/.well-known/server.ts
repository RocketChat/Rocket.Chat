import type { Router } from "@rocket.chat/http-router";
import { ajv } from '@rocket.chat/rest-typings/dist/v1/Ajv';
import { getAllServicesFromFederationSDK } from '../../setupContainers';
import { createHash } from 'node:crypto';

const WellKnownServerResponseSchema = {
    type: 'object',
    properties: {
        'm.server': {
            type: 'string',
            description: 'Matrix server address with port'
        }
    },
    required: ['m.server']
};

const isWellKnownServerResponseProps = ajv.compile(WellKnownServerResponseSchema);

export const getWellKnownRoutes = (router: Router<'/.well-known'>) => {
    const { wellKnown } = getAllServicesFromFederationSDK();
    
    return router.get('/matrix/server', {
        response: {
            200: isWellKnownServerResponseProps
        },
        tags: ['Well-Known'],
        license: ['federation']
    }, async (c) => {
        const responseData = wellKnown.getWellKnownHostData();
        
        const etag = createHash('md5')
            .update(JSON.stringify(responseData))
            .digest('hex');
        
        c.header('ETag', etag);
        c.header('Content-Type', 'application/json');

        return {
            body: responseData,
            statusCode: 200,
        };
    });
};

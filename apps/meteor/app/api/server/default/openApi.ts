import express, { Request, Response, NextFunction } from 'express';
import { WebApp } from 'meteor/webapp';
import swaggerUi from 'swagger-ui-express';
import Ajv, { ValidateFunction } from 'ajv';

import { settings } from '../../../settings/server';
import { Info } from '../../../utils/rocketchat.info';
import { API } from '../api';
import type { Route } from '../router';

const app = express();

// Enable CORS for JSON and UI endpoints
app.use('/api/v1/docs/json', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
app.use('/api-docs', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Initialize AJV
const ajv = new Ajv({ strict: false });

// Query schema for /api/v1/docs/json
const querySchema = {
  type: 'object',
  properties: {
    withUndocumented: { type: 'boolean' },
  },
  additionalProperties: false,
};
const validateQuery = ajv.compile(querySchema);

// Response schema for /api/v1/docs/json
const responseSchema = {
  type: 'object',
  properties: {
    openapi: { type: 'string' },
    info: { type: 'object' },
    servers: { type: 'array' },
    components: { type: 'object' },
    paths: { type: 'object' },
  },
  required: ['openapi', 'info', 'servers', 'components', 'paths'],
  additionalProperties: true,
};
const validateResponse: Record<number, ValidateFunction> = {
  200: ajv.compile(responseSchema),
};

// Filter out routes tagged as 'Missing Documentation'
const getTypedRoutes = (
  typedRoutes: Record<string, Record<string, Route>>,
  options: { withUndocumented?: boolean } = {},
): Record<string, Record<string, Route>> => {
  const { withUndocumented = false } = options;
  if (withUndocumented) {
    return typedRoutes;
  }
  return Object.fromEntries(
    Object.entries(typedRoutes)
      .map(([path, methods]) => [
        path,
        Object.fromEntries(
          Object.entries(methods).filter(
            ([, route]) => !route.tags?.includes('Missing Documentation'),
          ),
        ),
      ])
      .filter(([, methods]) => Object.keys(methods).length > 0),
  );
};

// Define the OpenAPI JSON endpoint using the new API methods
API.v1.get(
  'docs/json',
  {
    authRequired: false,
    query: validateQuery,
    response: validateResponse,
  },
  async function (this: any) {
    const { withUndocumented = false } = this.queryParams;
    console.debug('[OpenAPI] Generating spec, withUndocumented=', withUndocumented);
    const typedRoutes = getTypedRoutes(API.api.typedRoutes, { withUndocumented });
    const spec = {
      openapi: '3.0.3',
      info: {
        title: 'Rocket.Chat API',
        description: 'Rocket.Chat API',
        version: Info.version,
      },
      servers: [
        {
          url: settings.get('Site_Url'),
        },
      ],
      components: {
        securitySchemes: {
          userId: {
            type: 'apiKey',
            in: 'header',
            name: 'X-User-Id',
          },
          authToken: {
            type: 'apiKey',
            in: 'header',
            name: 'X-Auth-Token',
          },
        },
        schemas: {},
      },
      paths: typedRoutes,
    };

    // Validate the generated spec
    const valid = validateResponse[200](spec);
    if (!valid) {
      console.error('[OpenAPI] Response validation errors:', validateResponse[200].errors);
      throw new Error('Invalid OpenAPI spec');
    }

    return API.v1.success(spec);
  },
);

// Serve Swagger UI
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: `${settings.get('Site_Url')}/api/v1/docs/json`,
    },
  }),
);


// Mount Express app before Meteor's default handlers
WebApp.rawConnectHandlers.use(app);

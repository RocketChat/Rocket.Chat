import Ajv from 'ajv/dist/2020';

import type { OpenAPIDocsOptions } from './openapi';
import { buildOperation, buildOperationId, getSharedSchemas, toOpenAPIPath, withOperationIds } from './openapi';

const ajv = new Ajv();
ajv.addVocabulary(['example']);

const okSchema = ajv.compile({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
});

const querySchema = ajv.compile({
	type: 'object',
	properties: {
		platform: { type: 'string', enum: ['web', 'mobile'], description: 'The platform rendering the banner', example: 'web' },
		count: { type: 'number' },
	},
	required: ['platform'],
});

const build = (method: string, path: string, options: Partial<OpenAPIDocsOptions> = {}) =>
	buildOperation(method, path, { response: { 200: okSchema }, ...options });

describe('toOpenAPIPath', () => {
	it('should convert express-style params to openapi templates', () => {
		expect(toOpenAPIPath('/api/v1/banners/:id')).toBe('/api/v1/banners/{id}');
		expect(toOpenAPIPath('/api/v1/rooms/:rid/:fileId')).toBe('/api/v1/rooms/{rid}/{fileId}');
		expect(toOpenAPIPath('/api/v1/settings/:_id?')).toBe('/api/v1/settings/{_id}');
		expect(toOpenAPIPath('/api/v1/banners')).toBe('/api/v1/banners');
		expect(toOpenAPIPath('/api//docs/json')).toBe('/api/docs/json');
		expect(toOpenAPIPath('/api/apps//{id}/export-logs')).toBe('/api/apps/{id}/export-logs');
	});
});

describe('buildOperation', () => {
	it('should never emit an empty response description', () => {
		const operation = build('GET', '/api/v1/banners');

		expect(Object.keys(operation.responses).length).toBeGreaterThan(0);
		Object.values(operation.responses).forEach((response) => {
			expect(response.description).toBeTruthy();
		});
	});

	it('should document a success response even when the route declares none', () => {
		const operation = buildOperation('GET', '/api/v1/legacy', { tags: ['Missing Documentation'] });

		expect(operation.responses[200].content?.['application/json'].schema).toEqual({ $ref: '#/components/schemas/ApiSuccessV1' });
	});

	it('should derive path parameters from the path pattern', () => {
		const operation = build('GET', '/api/v1/rooms/:rid/:fileId');

		expect(operation.parameters).toEqual([
			{ name: 'rid', in: 'path', required: true, schema: { type: 'string' } },
			{ name: 'fileId', in: 'path', required: true, schema: { type: 'string' } },
		]);
	});

	it('should enrich path parameters with the params schema and examples', () => {
		const params = ajv.compile({
			type: 'object',
			properties: { id: { type: 'string', description: 'The id of the banner' } },
			required: ['id'],
		});

		const operation = build('GET', '/api/v1/banners/:id', { params, examples: { params: { id: 'ByehQjC44FwMeiLbX' } } });

		expect(operation.parameters).toEqual([
			{
				name: 'id',
				in: 'path',
				required: true,
				description: 'The id of the banner',
				example: 'ByehQjC44FwMeiLbX',
				schema: { type: 'string', description: 'The id of the banner' },
			},
		]);
	});

	it('should explode the query schema into one parameter per property', () => {
		const operation = build('GET', '/api/v1/banners', { query: querySchema });

		expect(operation.parameters).toEqual([
			{
				name: 'platform',
				in: 'query',
				required: true,
				description: 'The platform rendering the banner',
				example: 'web',
				schema: { type: 'string', enum: ['web', 'mobile'], description: 'The platform rendering the banner', example: 'web' },
			},
			{ name: 'count', in: 'query', required: false, schema: { type: 'number' } },
		]);
	});

	it('should union properties of composed query schemas, requiring only the shared ones', () => {
		const query = ajv.compile({
			oneOf: [
				{ type: 'object', properties: { roomId: { type: 'string' }, kind: { type: 'string' } }, required: ['roomId', 'kind'] },
				{ type: 'object', properties: { roomName: { type: 'string' }, kind: { type: 'string' } }, required: ['roomName', 'kind'] },
			],
		});

		const operation = build('GET', '/api/v1/rooms.info', { query });

		expect(operation.parameters?.map(({ name, required }) => ({ name, required }))).toEqual([
			{ name: 'roomId', required: false },
			{ name: 'kind', required: true },
			{ name: 'roomName', required: false },
		]);
	});

	it('should fall back to a single parameter for non-object query schemas', () => {
		const query = ajv.compile({ type: 'string' });

		const operation = build('GET', '/api/v1/weird', { query });

		expect(operation.parameters).toEqual([{ name: 'query', in: 'query', required: false, schema: { type: 'string' } }]);
	});

	it('should inject the error responses implied by the route options', () => {
		const operation = build('POST', '/api/v1/rooms.create', {
			authRequired: true,
			permissionsRequired: ['create-c'],
		});

		expect(Object.keys(operation.responses).sort()).toEqual(['200', '400', '401', '403', '429', '500']);
		expect(operation.responses[401].content?.['application/json'].schema).toEqual({ $ref: '#/components/schemas/ApiFailureV1' });
	});

	it('should keep declared responses over the injected ones', () => {
		const operation = build('GET', '/api/v1/banners', {
			response: { 200: okSchema, 400: okSchema },
			responseDescriptions: { 400: 'Custom bad request' },
		});

		expect(operation.responses[400].description).toBe('Custom bad request');
		expect(operation.responses[400].content?.['application/json'].schema).toEqual(okSchema.schema);
	});

	it('should not offer rate limit headers when rate limiting is disabled', () => {
		expect(build('GET', '/api/v1/banners').responses[200].headers).toHaveProperty('X-RateLimit-Limit');
		expect(build('GET', '/api/v1/banners', { rateLimiterOptions: false }).responses[200].headers).toBeUndefined();
		expect(Object.keys(build('GET', '/api/v1/banners', { rateLimiterOptions: false }).responses)).not.toContain('429');
	});

	it('should document two-factor headers and surface permissions and license as extensions', () => {
		const operation = build('POST', '/api/v1/users.delete', {
			authRequired: true,
			twoFactorRequired: true,
			permissionsRequired: { POST: { operation: 'hasAll', permissions: ['delete-user'] } },
			license: ['livechat-enterprise'],
		});

		expect(operation.parameters?.map(({ name, in: location }) => `${location}:${name}`)).toEqual([
			'header:x-2fa-code',
			'header:x-2fa-method',
		]);
		expect(Object.keys(operation.responses)).toContain('403');
		expect(operation['x-permissions']).toEqual(['delete-user']);
		expect(operation['x-license']).toEqual(['livechat-enterprise']);
		expect(operation['x-two-factor-required']).toBe(true);
		expect(operation.description).toContain('`delete-user`');
		expect(operation.description).toContain('two-factor');
		expect(operation.description).toContain('`livechat-enterprise`');
	});

	it('should mark deprecated routes and point to the alternatives', () => {
		const operation = build('GET', '/api/v1/channels.images', {
			deprecation: { version: '8.0.0', alternatives: ['/v1/rooms.images'] },
		});

		expect(operation.deprecated).toBe(true);
		expect(operation.description).toContain('8.0.0');
		expect(operation.description).toContain('`/v1/rooms.images`');
	});

	it('should document the request body with its content type and example', () => {
		const body = ajv.compile({ type: 'object', properties: { bannerId: { type: 'string' } }, required: ['bannerId'] });

		const operation = build('POST', '/api/v1/banners.dismiss', { body, examples: { body: { bannerId: 'ByehQjC44FwMeiLbX' } } });

		expect(operation.requestBody).toEqual({
			required: true,
			content: { 'application/json': { schema: body.schema, example: { bannerId: 'ByehQjC44FwMeiLbX' } } },
		});

		expect(build('POST', '/api/v1/rooms.media', { body, bodyContentType: 'multipart/form-data' }).requestBody?.content).toHaveProperty(
			'multipart/form-data',
		);
	});

	it('should only carry an operation id when the route declares one', () => {
		expect(build('GET', '/api/v1/banners/:id').operationId).toBeUndefined();
		expect(build('GET', '/api/v1/banners', { operationId: 'listBanners' }).operationId).toBe('listBanners');
	});

	it('should spell out the security requirement, empty included', () => {
		expect(build('GET', '/api/v1/info').security).toEqual([]);
		expect(build('GET', '/api/v1/me', { authRequired: true }).security).toEqual([{ userId: [], authToken: [] }]);
		expect(build('GET', '/api/v1/channels.anonymousread', { authOrAnonRequired: true }).security).toEqual([
			{ userId: [], authToken: [] },
			{},
		]);
	});

	it('should generate the operation id published at developer.rocket.chat', () => {
		expect(buildOperationId('GET', '/api/v1/banners/{id}')).toBe('get-api-v1-banners-id');
		expect(buildOperationId('POST', '/api/v1/banners.dismiss')).toBe('post-api-v1-banners.dismiss');
	});
	it('should render named scenarios as an examples map', () => {
		const operation = build('GET', '/api/v1/rooms.info', {
			response: { 200: okSchema, 400: okSchema },
			examples: {
				response: {
					200: {
						byId: { summary: 'Looked up by id', value: { success: true } },
						byName: { value: { success: true } },
					},
					400: { success: false, error: 'error-room-not-found' },
				},
			},
		});

		expect(operation.responses[200].content?.['application/json'].examples).toEqual({
			byId: { summary: 'Looked up by id', value: { success: true } },
			byName: { value: { success: true } },
		});
		expect(operation.responses[200].content?.['application/json'].example).toBeUndefined();
		expect(operation.responses[400].content?.['application/json'].example).toEqual({ success: false, error: 'error-room-not-found' });
	});

	it('should render named scenarios for the request body too', () => {
		const body = ajv.compile({ type: 'object', properties: { roomId: { type: 'string' } } });
		const operation = build('POST', '/api/v1/chat.postMessage', {
			body,
			examples: { body: { minimal: { value: { roomId: 'GENERAL' } }, withAttachment: { value: { roomId: 'GENERAL' } } } },
		});

		expect(Object.keys(operation.requestBody?.content['application/json'].examples ?? {})).toEqual(['minimal', 'withAttachment']);
	});

	it('should treat a payload that merely has a "value" key as a single example', () => {
		const operation = build('GET', '/api/v1/settings/{_id}', { examples: { response: { 200: { value: 'a setting value' } } } });

		expect(operation.responses[200].content?.['application/json'].example).toEqual({ value: 'a setting value' });
		expect(operation.responses[200].content?.['application/json'].examples).toBeUndefined();
	});

	it('should honor a per-status content type', () => {
		const operation = build('GET', '/api/v1/shield.svg', { responseContentType: { 200: 'image/svg+xml' } });

		expect(Object.keys(operation.responses[200].content ?? {})).toEqual(['image/svg+xml']);
		expect(Object.keys(operation.responses[400].content ?? {})).toEqual(['application/json']);
	});

	it('should merge declared response headers with the rate limit ones', () => {
		const operation = build('GET', '/api/v1/rooms.media/{rid}', {
			responseHeaders: { 200: { 'Content-Disposition': { description: 'Attachment file name', schema: { type: 'string' } } } },
		});

		expect(Object.keys(operation.responses[200].headers ?? {})).toEqual([
			'X-RateLimit-Limit',
			'X-RateLimit-Remaining',
			'X-RateLimit-Reset',
			'Content-Disposition',
		]);
		expect(build('GET', '/api/v1/x', { rateLimiterOptions: false }).responses[200].headers).toBeUndefined();
	});
	it('should hoist schemas that carry an $id into components and reference them', () => {
		const shared = ajv.compile({
			$id: 'BadRequestError',
			type: 'object',
			properties: { success: { type: 'boolean', enum: [false] }, error: { type: 'string' } },
			required: ['success'],
		});

		const operation = build('POST', '/api/v1/rooms.create', { response: { 200: okSchema, 400: shared }, body: shared });

		expect(operation.responses[400].content?.['application/json'].schema).toEqual({ $ref: '#/components/schemas/BadRequestError' });
		expect(operation.requestBody?.content['application/json'].schema).toEqual({ $ref: '#/components/schemas/BadRequestError' });
		// inlined once in components, without the `$id` that put it there
		expect(getSharedSchemas().BadRequestError).toEqual({
			type: 'object',
			properties: { success: { type: 'boolean', enum: [false] }, error: { type: 'string' } },
			required: ['success'],
		});
		// schemas without an $id stay inline
		expect(operation.responses[200].content?.['application/json'].schema).toEqual(okSchema.schema);
	});
	it('should convert `nullable` to the 3.1 spelling', () => {
		const schema = ajv.compile({
			type: 'object',
			properties: {
				name: { type: 'string', nullable: true },
				count: { type: ['number', 'null'], nullable: true },
				plain: { type: 'string' },
			},
		});

		const operation = build('GET', '/api/v1/rooms.info', { response: { 200: schema } });
		const { properties } = operation.responses[200].content?.['application/json'].schema as { properties: Record<string, unknown> };

		expect(properties.name).toEqual({ type: ['string', 'null'] });
		expect(properties.count).toEqual({ type: ['number', 'null'] });
		expect(properties.plain).toEqual({ type: 'string' });
		expect(JSON.stringify(operation)).not.toContain('nullable');
	});
	it('should require every path parameter, even one the router declares optional', () => {
		const operation = build('GET', '/api/v1/settings/:_id?');

		expect(operation.parameters).toEqual([{ name: '_id', in: 'path', required: true, schema: { type: 'string' } }]);
	});

	it('should not invent a success response for a route that answers a redirect', () => {
		const operation = buildOperation('GET', '/api/v1/shield.svg', { response: { 302: okSchema } });

		expect(Object.keys(operation.responses)).not.toContain('200');
		expect(operation.responses[302]).toBeDefined();
	});

	it('should read the permissions of the method over the wildcard ones', () => {
		const operation = build('POST', '/api/v1/rooms.create', {
			permissionsRequired: { 'POST': ['create-c'], '*': ['view-c-room'] },
		});

		expect(operation['x-permissions']).toEqual(['create-c']);
	});
});

describe('withOperationIds', () => {
	it('should fill in missing operation ids from the final path and keep declared ones', () => {
		const paths = withOperationIds({
			'/api/v1/banners/{id}': { get: build('GET', '/v1/banners/:id') },
			'/api/v1/banners': { get: build('GET', '/v1/banners', { operationId: 'listBanners' }) },
		});

		expect(paths['/api/v1/banners/{id}'].get.operationId).toBe('get-api-v1-banners-id');
		expect(paths['/api/v1/banners'].get.operationId).toBe('listBanners');
	});
});

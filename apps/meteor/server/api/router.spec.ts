import { createNodeServer, createRootApp, mountRouter } from '@rocket.chat/http-router';
import Ajv from 'ajv';
import request from 'supertest';

import type { APIActionContext } from './router';
import { RocketChatAPIRouter } from './router';

const serve = (router: Parameters<typeof mountRouter>[1]) => {
	const app = createRootApp();
	mountRouter(app, router);
	return createNodeServer(app);
};

describe('Router use method', () => {
	it('should parse nested query params into object for GET requests', async () => {
		const ajv = new Ajv();

		const isTestQueryParams = ajv.compile({
			type: 'object',
			properties: {
				outerProperty: { type: 'object', properties: { innerProperty: { type: 'string' } } },
			},
			additionalProperties: false,
			required: ['outerProperty'],
		});

		const api = new RocketChatAPIRouter('/api').get(
			'/test',
			{
				response: {
					200: ajv.compile({
						type: 'object',
						properties: {
							outerProperty: { type: 'object', properties: { innerProperty: { type: 'string' } } },
						},
						additionalProperties: false,
						required: ['outerProperty'],
					}),
				},
				query: isTestQueryParams,
			},
			async function action(this: APIActionContext) {
				const { outerProperty } = this.queryParams;
				return {
					statusCode: 200,
					body: {
						outerProperty,
					},
				};
			},
		);

		const app = serve(api);

		const response1 = await request(app).get('/api/test?outerProperty[innerProperty]=test');

		expect(response1.statusCode).toBe(200);
		expect(response1.body).toHaveProperty('outerProperty');
		expect(response1.body.outerProperty).toHaveProperty('innerProperty', 'test');
	});
});

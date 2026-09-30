import request from 'supertest';

import { apiServer } from './router';

apiServer.post('/api/apps/private/:appId/:hash', (req, res) => {
	res.json({
		body: req.body,
		params: req.params,
		query: req.query,
	});
});

apiServer.post('/api/apps/public/:appId', (req, res) => {
	res.json({
		body: req.body,
		params: req.params,
		query: req.query,
	});
});

describe('API Server Routes', () => {
	it('should handle POST requests to /api/apps/private/:appId/:hash using json encoding', async () => {
		const appId = 'testAppId';
		const hash = 'testHash';
		await request(apiServer)
			.post(`/api/apps/private/${appId}/${hash}`)
			.set('Content-Type', 'application/json')
			.send({
				key: 'value',
			})
			.expect('Content-Type', /json/)
			.expect(200)
			.then((res) => {
				expect(res.body).toEqual({
					body: { key: 'value' },
					params: { appId, hash },
					query: {},
				});
			});
	});

	it('should handle POST requests to /api/apps/private/:appId/:hash using x-www-form-urlencoded encoding', async () => {
		const appId = 'testAppId';
		const hash = 'testHash';
		await request(apiServer)
			.post(`/api/apps/private/${appId}/${hash}`)
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.send('key=value')
			.expect('Content-Type', /json/)
			.expect(200)
			.then((res) => {
				expect(res.body).toEqual({
					body: { key: 'value' },
					params: { appId, hash },
					query: {},
				});
			});
	});

	it('should handle POST requests to /api/apps/public/:appId using json encoding', async () => {
		const appId = 'testAppId';
		await request(apiServer)
			.post(`/api/apps/public/${appId}`)
			.set('Content-Type', 'application/json')
			.send({
				key: 'value',
			})
			.expect('Content-Type', /json/)
			.expect(200)
			.then((res) => {
				expect(res.body).toEqual({
					body: { key: 'value' },
					params: { appId },
					query: {},
				});
			});
	});

	it('should handle POST requests to /api/apps/public/:appId using x-www-form-urlencoded encoding', async () => {
		const appId = 'testAppId';
		await request(apiServer)
			.post(`/api/apps/public/${appId}`)
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.send('key=value')
			.expect('Content-Type', /json/)
			.expect(200)
			.then((res) => {
				expect(res.body).toEqual({
					body: { key: 'value' },
					params: { appId },
					query: {},
				});
			});
	});
});

import { describe, it } from 'mocha';

import { request } from '../../data/api-data.js';

describe('assets', function () {
	this.retries(0);

	it('should always have CORS headers for assets', async () => {
		await request.get('/assets/favicon.svg').expect('Content-Type', 'image/svg+xml').expect('Access-Control-Allow-Origin', '*').expect(200);

		await request.get('/fonts/rocketchat.woff2').expect('Content-Type', 'font/woff2').expect('Access-Control-Allow-Origin', '*').success();
	});
});

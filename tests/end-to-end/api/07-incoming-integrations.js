/* eslint-env mocha */

import {getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('Incoming Integrations', function() {
	this.retries(0);

	let integration;

	before(done => getCredentials(done));

	before((done) => {
		request.post(api('integrations.create'))
			.set(credentials)
			.send({
				type: 'webhook-incoming',
				name: 'Incoming test',
				enabled: true,
				username: 'rocket.cat',
				scriptEnabled: false,
				channel: '#general'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				integration = res.body.integration;
			})
			.end(done);
	});

	after((done) => {
		request.post(api('integrations.remove'))
			.set(credentials)
			.send({
				type: 'webhook-incoming',
				integrationId: integration._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end(done);
	});

	it('should execute the incoming integration', (done) => {
		request.post(`/hooks/${ integration._id }/${ integration.token }`)
			.send({
				text: 'Example message'
			})
			.expect(200)
			.end(done);
	});
});

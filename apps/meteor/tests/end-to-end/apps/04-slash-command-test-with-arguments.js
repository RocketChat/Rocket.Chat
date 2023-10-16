import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, request, credentials, api } from '../../data/api-data.js';
import { cleanupApps, installTestApp } from '../../data/apps/helper.js';

describe('Apps - Slash Command "test-with-arguments"', function () {
	this.retries(0);

	before((done) => getCredentials(done));
	before(async () => {
		await cleanupApps();
		await installTestApp();
	});

	describe('[Slash command "test-with-arguments"]', () => {
		const params = 'argument';
		it('should execute the slash command successfully', (done) => {
			request
				.post(api('commands.run'))
				.send({
					roomId: 'GENERAL',
					command: 'test-with-arguments',
					params,
				})
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
				})
				.end(done);
		});
		it('should have sent the message correctly', (done) => {
			const searchText = `Slashcommand \'test-with-arguments\' successfully executed with arguments: "${params}"`;
			request
				.get(api('chat.search'))
				.query({
					roomId: 'GENERAL',
					searchText,
				})
				.set(credentials)
				.expect(200)
				.expect((res) => {
					const message = res.body.messages.find((message) => message.msg === searchText);
					expect(message).to.not.be.equal(undefined);
				})
				.end(done);
		});
	});
});

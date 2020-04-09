import { expect } from 'chai';

import { getCredentials, request, credentials, api } from '../../data/api-data.js';
import { cleanupApps, installTestApp } from '../../data/apps/helper.js';

describe('Apps - Slash Command "test-simple"', function() {
	this.retries(0);

	before((done) => getCredentials(done));
	before(async () => {
		await cleanupApps();
		await installTestApp();
	});

	describe('[Slash command "test-simple"]', () => {
		it('should execute the slash command successfully', (done) => {
			request.post(api('commands.run'))
				.send({
					roomId: 'GENERAL',
					command: 'test-simple',
				})
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
				})
				.end(done);
		});
		it('should have sent the message correctly', (done) => {
			request.get(api('chat.search'))
				.query({
					roomId: 'GENERAL',
					searchText: 'Slashcommand \'test-simple\' successfully executed',
				})
				.set(credentials)
				.expect(200)
				.expect((res) => {
					const message = res.body.messages.find((message) => message.msg === 'Slashcommand \'test-simple\' successfully executed');
					expect(message).to.not.be.equal(undefined);
				})
				.end(done);
		});
	});
});

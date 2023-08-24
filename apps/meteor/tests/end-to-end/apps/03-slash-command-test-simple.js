import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, request, credentials, api } from '../../data/api-data.js';
import { cleanupApps, installTestApp } from '../../data/apps/helper.js';

describe('Apps - Slash Command "test-simple"', function () {
	this.retries(0);

	before((done) => getCredentials(done));
	before(async () => {
		await cleanupApps();
		await installTestApp();
	});

	describe('[Slash command "test-simple"]', () => {
		it('should return an error when no command is provided', (done) => {
			request
				.post(api('commands.run'))
				.send({
					roomId: 'GENERAL',
					command: null,
				})
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', false);
					expect(res.body.error).to.be.equal('You must provide a command to run.');
				})
				.end(done);
		});
		it('should return an error when the command does not exist', (done) => {
			request
				.post(api('commands.run'))
				.send({
					roomId: 'GENERAL',
					command: 'invalid-command',
				})
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', false);
					expect(res.body.error).to.be.equal('The command provided does not exist (or is disabled).');
				})
				.end(done);
		});
		it('should execute the slash command successfully', (done) => {
			request
				.post(api('commands.run'))
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
			request
				.get(api('chat.search'))
				.query({
					roomId: 'GENERAL',
					searchText: "Slashcommand 'test-simple' successfully executed",
				})
				.set(credentials)
				.expect(200)
				.expect((res) => {
					const message = res.body.messages.find((message) => message.msg === "Slashcommand 'test-simple' successfully executed");
					expect(message).to.not.be.equal(undefined);
				})
				.end(done);
		});
	});
});

import type { IMessage } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials, api } from '../../data/api-data';
import { cleanupApps, installTestApp } from '../../data/apps/helper';

describe('Apps - Slash Command "test-simple"', () => {
	before((done) => getCredentials(done));
	before(async () => {
		await cleanupApps();
		await installTestApp();
	});

	after(() => cleanupApps());

	describe('[Slash command "test-simple"]', () => {
		it('should return an error when no command is provided', (done) => {
			void request
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
			void request
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
			void request
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
			void request
				.get(api('chat.search'))
				.query({
					roomId: 'GENERAL',
					searchText: "Slashcommand 'test-simple' successfully executed",
				})
				.set(credentials)
				.expect(200)
				.expect((res) => {
					const message = (res.body.messages as IMessage[]).find(
						(message) => message.msg === "Slashcommand 'test-simple' successfully executed",
					);
					expect(message).to.not.be.equal(undefined);
				})
				.end(done);
		});
	});
});

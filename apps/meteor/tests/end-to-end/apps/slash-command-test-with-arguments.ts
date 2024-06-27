import type { IMessage } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials, api } from '../../data/api-data';
import { cleanupApps, installTestApp } from '../../data/apps/helper';

describe('Apps - Slash Command "test-with-arguments"', () => {
	before((done) => getCredentials(done));
	before(async () => {
		await cleanupApps();
		await installTestApp();
	});

	after(() => cleanupApps());

	describe('[Slash command "test-with-arguments"]', () => {
		const params = 'argument';
		it('should execute the slash command successfully', (done) => {
			void request
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
			void request
				.get(api('chat.search'))
				.query({
					roomId: 'GENERAL',
					searchText,
				})
				.set(credentials)
				.expect(200)
				.expect((res) => {
					const message = (res.body.messages as IMessage[]).find((message) => message.msg === searchText);
					expect(message).to.not.be.equal(undefined);
				})
				.end(done);
		});
	});
});

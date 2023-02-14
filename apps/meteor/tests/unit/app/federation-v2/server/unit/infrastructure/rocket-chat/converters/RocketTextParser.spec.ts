import { expect } from 'chai';

import {
	toInternalMessageFormat,
	toInternalQuoteMessageFormat,
} from '../../../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/converters/MessageTextParser';

describe('Federation - Infrastructure - Matrix - RocketTextParser', () => {
	describe('#toInternalMessageFormat ()', () => {
		it('should parse the user mention correctly', async () => {
			expect(
				await toInternalMessageFormat({
					message: 'hey <a href="https://matrix.to/#/@user:server.com">@user:server.com</a>',
					homeServerDomain: 'localDomain',
				}),
			).to.be.equal('hey @user:server.com');
		});

		it('should parse the @all mention correctly', async () => {
			expect(
				await toInternalMessageFormat({
					message: 'hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>',
					homeServerDomain: 'localDomain',
				}),
			).to.be.equal('hey @all');
		});

		it('should parse the @here mention correctly', async () => {
			expect(
				await toInternalMessageFormat({
					message: 'hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>',
					homeServerDomain: 'localDomain',
				}),
			).to.be.equal('hey @all');
		});

		it('should parse multiple and different mentions in the same message correctly', async () => {
			expect(
				await toInternalMessageFormat({
					message:
						'hey <a href="https://matrix.to/#/@user:server.com">@user:server.com</a>, hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>, hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>',
					homeServerDomain: 'localDomain',
				}),
			).to.be.equal('hey @user:server.com, hey @all, hey @all');
		});

		it('should parse the @user mention without to include the server name when the user is original from the local ', async () => {
			expect(
				await toInternalMessageFormat({
					message: 'hey <a href="https://matrix.to/#/@user:localDomain">@user:localDomain</a>',
					homeServerDomain: 'localDomain',
				}),
			).to.be.equal('hey @user');
		});

		it('should return the message as-is when it does not have any mention', async () => {
			expect(
				await toInternalMessageFormat({
					message: 'hey people, how are you?',
					homeServerDomain: 'localDomain',
				}),
			).to.be.equal('hey people, how are you?');
		});
	});

	describe('#toInternalQuoteMessageFormat ()', () => {
		it('should parse the external quote to the internal one correctly', async () => {
			const message =
				'<mx-reply><blockquote><a href="https://matrix.to/#/externalRoomId/eventToReplyToId">In reply to</a> <a href="https://matrix.to/#/originalEventSender">originalEventSender</a><br /></blockquote></mx-reply>hey people, how are you?';
			const homeServerDomain = 'localDomain.com';

			expect(
				await toInternalQuoteMessageFormat({
					homeServerDomain,
					message,
					messageToReplyToUrl: 'http://localhost:3000/group/1?msg=2354543564',
				}),
			).to.be.equal(`[ ](http://localhost:3000/group/1?msg=2354543564) hey people, how are you?`);
		});
	});
});

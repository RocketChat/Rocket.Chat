import { expect } from 'chai';

import {
	toExternalMessageFormat,
	toExternalQuoteMessageFormat,
} from '../../../../../../../../../app/federation-v2/server/infrastructure/matrix/converters/MessageTextParser';

describe('Federation - Infrastructure - Matrix - MatrixTextParser', () => {
	describe('#toExternalMessageFormat ()', () => {
		it('should parse the user mention correctly', async () => {
			expect(
				await toExternalMessageFormat({
					message: 'hey @user:server.com',
					externalRoomId: 'externalRoomId',
					homeServerDomain: 'localDomain',
				}),
			).to.be.equal('hey <a href="https://matrix.to/#/@user:server.com">@user:server.com</a>');
		});

		it('should parse the @all mention correctly', async () => {
			expect(
				await toExternalMessageFormat({
					message: 'hey @all',
					externalRoomId: 'externalRoomId',
					homeServerDomain: 'localDomain',
				}),
			).to.be.equal('hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>');
		});

		it('should parse the @here mention correctly', async () => {
			expect(
				await toExternalMessageFormat({
					message: 'hey @here',
					externalRoomId: 'externalRoomId',
					homeServerDomain: 'localDomain',
				}),
			).to.be.equal('hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>');
		});

		it('should parse the user local mentions appending the local domain server in the mention', async () => {
			expect(
				await toExternalMessageFormat({
					message: 'hey @user',
					externalRoomId: 'externalRoomId',
					homeServerDomain: 'localDomain.com',
				}),
			).to.be.equal('hey <a href="https://matrix.to/#/@user:localDomain.com">@user:localDomain.com</a>');
		});

		it('should parse multiple and different mentions in the same message correctly', async () => {
			expect(
				await toExternalMessageFormat({
					message: 'hey @user:server.com, hey @all, hey @here @user',
					externalRoomId: 'externalRoomId',
					homeServerDomain: 'localDomain.com',
				}),
			).to.be.equal(
				'hey <a href="https://matrix.to/#/@user:server.com">@user:server.com</a>, hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>, hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a> <a href="https://matrix.to/#/@user:localDomain.com">@user:localDomain.com</a>',
			);
		});

		it('should parse multiple and different mentions in the same message correctly removing every markdown occurence', async () => {
			expect(
				await toExternalMessageFormat({
					message: '[ ](http://localhost:3000/group/1?msg=213434343) hey @user:server.com, hey @all, hey @here @user',
					externalRoomId: 'externalRoomId',
					homeServerDomain: 'localDomain.com',
				}),
			).to.be.equal(
				'hey <a href="https://matrix.to/#/@user:server.com">@user:server.com</a>, hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>, hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a> <a href="https://matrix.to/#/@user:localDomain.com">@user:localDomain.com</a>',
			);
		});

		it('should return the message as-is when it does not have any mention', async () => {
			expect(
				await toExternalMessageFormat({
					message: 'hey people, how are you?',
					externalRoomId: 'externalRoomId',
					homeServerDomain: 'localDomain.com',
				}),
			).to.be.equal('hey people, how are you?');
		});
	});

	describe('#toExternalQuoteMessageFormat ()', () => {
		it('should parse the internal quote to the external one correctly', async () => {
			const eventToReplyTo = 'eventToReplyTo';
			const message = 'hey people, how are you?';
			const externalRoomId = 'externalRoomId';
			const homeServerDomain = 'localDomain.com';
			const originalEventSender = 'originalEventSenderId';

			expect(
				await toExternalQuoteMessageFormat({
					eventToReplyTo,
					message,
					externalRoomId,
					homeServerDomain,
					originalEventSender,
				}),
			).to.be.eql({
				message: `> <${originalEventSender}> \n\n${message}`,
				formattedMessage: `<mx-reply><blockquote><a href="https://matrix.to/#/${externalRoomId}/${eventToReplyTo}">In reply to</a> <a href="https://matrix.to/#/${originalEventSender}">${originalEventSender}</a><br /></blockquote></mx-reply>${message}`,
			});
		});
	});
});

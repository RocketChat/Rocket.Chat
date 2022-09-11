import { expect } from 'chai';

import {
	toExternalMessageFormat,
	toInternalMessageFormat,
} from '../../../../../../../../../app/federation-v2/server/infrastructure/matrix/converters/MessageTextParser';

describe('Federation - Infrastructure - Matrix - MatrixTextParser', () => {
	describe('#toExternalMessageFormat ()', () => {
		it('should parse the user mention correctly', async () => {
			expect(await toExternalMessageFormat('hey @user:server.com', 'externalRoomId')).to.be.equal(
				'hey <a href="https://matrix.to/#/@user:server.com">@user:server.com</a>',
			);
		});

		it('should parse the @all mention correctly', async () => {
			expect(await toExternalMessageFormat('hey @all', 'externalRoomId')).to.be.equal(
				'hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>',
			);
		});

		it('should parse the @here mention correctly', async () => {
			expect(await toExternalMessageFormat('hey @here', 'externalRoomId')).to.be.equal(
				'hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>',
			);
		});

		it('should parse multiple and different mentions in the same message correctly', async () => {
			expect(await toExternalMessageFormat('hey @user:server.com, hey @all, hey @here', 'externalRoomId')).to.be.equal(
				'hey <a href="https://matrix.to/#/@user:server.com">@user:server.com</a>, hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>, hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>',
			);
		});

		it('should return the message as-is when it does not have any mention', async () => {
			expect(await toExternalMessageFormat('hey people, how are you?', 'externalRoomId')).to.be.equal('hey people, how are you?');
		});
	});

	describe('#toInternalMessageFormat ()', () => {
		it('should parse the user mention correctly', async () => {
			expect(
				await toInternalMessageFormat('hey <a href="https://matrix.to/#/@user:server.com">@user:server.com</a>', 'localDomain'),
			).to.be.equal('hey @user:server.com');
		});

		it('should parse the @all mention correctly', async () => {
			expect(
				await toInternalMessageFormat('hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>', 'localDomain'),
			).to.be.equal('hey @all');
		});

		it('should parse the @here mention correctly', async () => {
			expect(
				await toInternalMessageFormat('hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>', 'localDomain'),
			).to.be.equal('hey @all');
		});

		it('should parse multiple and different mentions in the same message correctly', async () => {
			expect(
				await toInternalMessageFormat(
					'hey <a href="https://matrix.to/#/@user:server.com">@user:server.com</a>, hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>, hey <a href="https://matrix.to/#/externalRoomId">externalRoomId</a>',
					'localDomain',
				),
			).to.be.equal('hey @user:server.com, hey @all, hey @all');
		});

		it('should parse the @user mention without to include the server name when the user is original from the local ', async () => {
			expect(
				await toInternalMessageFormat('hey <a href="https://matrix.to/#/@user:localDomain">@user:localDomain</a>', 'localDomain'),
			).to.be.equal('hey @user');
		});

		it('should return the message as-is when it does not have any mention', async () => {
			expect(await toInternalMessageFormat('hey people, how are you?', 'localDomain')).to.be.equal('hey people, how are you?');
		});
	});
});

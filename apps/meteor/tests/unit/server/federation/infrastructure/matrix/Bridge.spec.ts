import { expect } from 'chai';
import proxyquire from 'proxyquire';

import { VerificationStatus } from '../../../../../../server/services/federation/infrastructure/matrix/helpers/MatrixIdVerificationTypes';

const fetchStub = {
	serverFetch: () => Promise.resolve({}),
};

const { MatrixBridge } = proxyquire.noCallThru().load('../../../../../../server/services/federation/infrastructure/matrix/Bridge', {
	'@rocket.chat/server-fetch': fetchStub,
});

describe('Federation - Infrastructure - Matrix - Bridge', () => {
	const defaultProxyDomain = 'server.com';
	const bridge = new MatrixBridge(
		{
			getHomeServerDomain: () => defaultProxyDomain,
		} as any,
		() => undefined,
	);

	describe('#isUserIdFromTheSameHomeserver()', () => {
		it('should return true if the userId is from the same homeserver', () => {
			expect(bridge.isUserIdFromTheSameHomeserver('@user:server.com', 'server.com')).to.be.true;
		});

		it('should return false if the userId is from a different homeserver', () => {
			expect(bridge.isUserIdFromTheSameHomeserver('@user:server2.com', 'server.com')).to.be.false;
		});

		it('should return true if the userId is from the default homeserver', () => {
			expect(bridge.isUserIdFromTheSameHomeserver('@user', 'server.com')).to.be.true;
		});
	});

	describe('#extractHomeserverOrigin()', () => {
		it('should return the proxy homeserver origin if there is no server in the userId', () => {
			expect(bridge.extractHomeserverOrigin('@user')).to.be.equal(defaultProxyDomain);
		});

		it('should return the homeserver origin if there is a server in the userId', () => {
			expect(bridge.extractHomeserverOrigin('@user:matrix.org')).to.be.equal('matrix.org');
		});
	});

	describe('#isRoomFromTheSameHomeserver()', () => {
		it('should return true if the room is from the same homeserver', () => {
			expect(bridge.isRoomFromTheSameHomeserver('!room:server.com', 'server.com')).to.be.true;
		});

		it('should return false if the room is from a different homeserver', () => {
			expect(bridge.isRoomFromTheSameHomeserver('!room:server2.com', 'server.com')).to.be.false;
		});
	});

	describe('#verifyInviteeId()', () => {
		it('should return `VERIFIED` when the matrixId exists', async () => {
			fetchStub.serverFetch = () => Promise.resolve({ status: 400, json: () => Promise.resolve({ errcode: 'M_USER_IN_USE' }) });

			const verificationStatus = await bridge.verifyInviteeId('@user:server.com');

			expect(verificationStatus).to.be.equal(VerificationStatus.VERIFIED);
		});

		it('should return `UNVERIFIED` when the matrixId does not exists', async () => {
			fetchStub.serverFetch = () => Promise.resolve({ status: 200, json: () => Promise.resolve({}) });

			const verificationStatus = await bridge.verifyInviteeId('@user:server.com');

			expect(verificationStatus).to.be.equal(VerificationStatus.UNVERIFIED);
		});

		it('should return `UNABLE_TO_VERIFY` when the fetch() call fails', async () => {
			fetchStub.serverFetch = () => Promise.reject(new Error('Error'));

			const verificationStatus = await bridge.verifyInviteeId('@user:server.com');

			expect(verificationStatus).to.be.equal(VerificationStatus.UNABLE_TO_VERIFY);
		});

		it('should return `UNABLE_TO_VERIFY` when an unexepected status comes', async () => {
			fetchStub.serverFetch = () => Promise.resolve({ status: 500 });

			const verificationStatus = await bridge.verifyInviteeId('@user:server.com');

			expect(verificationStatus).to.be.equal(VerificationStatus.UNABLE_TO_VERIFY);
		});
	});
});

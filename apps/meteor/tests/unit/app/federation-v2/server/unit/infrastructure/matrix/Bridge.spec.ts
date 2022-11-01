/* eslint-disable import/first */
import { expect } from 'chai';
import proxyquire from 'proxyquire';

const { MatrixBridge } = proxyquire.noCallThru().load('../../../../../../../../app/federation-v2/server/infrastructure/matrix/Bridge', {
	'meteor/fetch': {
		'@global': true,
	},
});

describe('Federation - Infrastructure - Matrix - Bridge', () => {
	const defaultProxyDomain = 'server.com';
	const bridge = new MatrixBridge('', '', defaultProxyDomain, '', 3030, {} as any, () => { }); // eslint-disable-line

	describe('#isUserIdFromTheSameHomeserver()', () => {
		it('should return true if the userId is from the same homeserver', () => {
			expect(bridge.isUserIdFromTheSameHomeserver('@user:server.com', 'server.com')).to.be.true;
		});

		it('should return false if the userId is from a different homeserver', () => {
			expect(bridge.isUserIdFromTheSameHomeserver('@user:server2.com', 'server.com')).to.be.false;
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
});

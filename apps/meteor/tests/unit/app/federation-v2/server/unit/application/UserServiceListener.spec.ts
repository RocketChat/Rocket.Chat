/* eslint-disable import/first */
import { expect } from 'chai';
import sinon from 'sinon';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import proxyquire from 'proxyquire';

const { FederationUserServiceListener } = proxyquire
	.noCallThru()
	.load('../../../../../../../app/federation-v2/server/application/UserServiceListener', {
		mongodb: {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
	});

const { FederatedUser } = proxyquire.noCallThru().load('../../../../../../../app/federation-v2/server/domain/FederatedUser', {
	mongodb: {
		'ObjectId': class ObjectId {
			toHexString(): string {
				return 'hexString';
			}
		},
		'@global': true,
	},
});

const { FederatedRoom } = proxyquire.noCallThru().load('../../../../../../../app/federation-v2/server/domain/FederatedRoom', {
	mongodb: {
		'ObjectId': class ObjectId {
			toHexString(): string {
				return 'hexString';
			}
		},
		'@global': true,
	},
});

describe('Federation - Application - FederationUserServiceListener', () => {
	let service: typeof FederationUserServiceListener;
	const roomAdapter = {
		getFederatedRoomByExternalId: sinon.stub(),
	};
	const userAdapter = {
		getFederatedUsersByExternalIds: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub().returns('localDomain'),
	};
	const fileAdapter = {};
	const notificationAdapter = {
		notifyUserTypingOnRoom: sinon.stub(),
	};
	const bridge = {};

	beforeEach(() => {
		service = new FederationUserServiceListener(
			roomAdapter as any,
			userAdapter as any,
			fileAdapter as any,
			notificationAdapter as any,
			settingsAdapter as any,
			bridge as any,
		);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByExternalId.reset();
		userAdapter.getFederatedUsersByExternalIds.reset();
		notificationAdapter.notifyUserTypingOnRoom.reset();
		service.usersTypingByRoomIdCache.clear();
	});

	describe('#onUserTyping()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');

		it('should NOT notify about the typing event internally if the room does not exists', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(undefined);
			await service.onUserTyping({} as any);

			expect(userAdapter.getFederatedUsersByExternalIds.called).to.be.false;
			expect(notificationAdapter.notifyUserTypingOnRoom.called).to.be.false;
		});

		it('should NOT notify about the typing nor not typing event internally there is no external users typing', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves({});
			userAdapter.getFederatedUsersByExternalIds.resolves([]);
			await service.onUserTyping({
				externalRoomId: 'externalRoomId',
				externalUserIdsTyping: ['id1', 'id2', 'id3'],
			} as any);

			expect(notificationAdapter.notifyUserTypingOnRoom.called).to.be.false;
		});

		it('should NOT notify about internally when all external users are still styping', async () => {
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUsersByExternalIds.resolves([]);
			service.usersTypingByRoomIdCache.set('externalRoomId', [
				{ externalUserId: 'id1', username: 'id1' },
				{ externalUserId: 'id2', username: 'id2' },
				{ externalUserId: 'id3', username: 'id3' },
			]);
			await service.onUserTyping({
				externalRoomId: 'externalRoomId',
				externalUserIdsTyping: ['id1', 'id2', 'id3'],
			} as any);

			expect(notificationAdapter.notifyUserTypingOnRoom.called).to.be.false;
			expect(service.usersTypingByRoomIdCache.get('externalRoomId')).to.deep.equal([
				{ externalUserId: 'id1', username: 'id1' },
				{ externalUserId: 'id2', username: 'id2' },
				{ externalUserId: 'id3', username: 'id3' },
			]);
		});

		it('should notify about internally when the external users stopped typing', async () => {
			const notTypingAnymore = ['id2', 'id3'];
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUsersByExternalIds.resolves([]);
			service.usersTypingByRoomIdCache.set('externalRoomId', [
				{ externalUserId: 'id1', username: 'id1' },
				{ externalUserId: 'id2', username: 'id2' },
				{ externalUserId: 'id3', username: 'id3' },
			]);
			await service.onUserTyping({
				externalRoomId: 'externalRoomId',
				externalUserIdsTyping: ['id1'],
			} as any);

			notTypingAnymore.forEach((username) => {
				expect(notificationAdapter.notifyUserTypingOnRoom.calledWith('hexString', username, false)).to.be.true;
			});
			expect(service.usersTypingByRoomIdCache.get('externalRoomId')).to.deep.equal([{ externalUserId: 'id1', username: 'id1' }]);
		});

		it('should notify about internally when one users stopped typing and other started it', async () => {
			const notTypingAnymore = ['id3', 'id4'];
			const startedTyping = ['id1', 'id2'];
			const user1 = FederatedUser.createWithInternalReference('!externalId@id1', true, { _id: 'id1', username: 'id1' } as any);
			const user2 = FederatedUser.createWithInternalReference('!externalId@id2', true, { _id: 'id2', username: 'id2' } as any);
			roomAdapter.getFederatedRoomByExternalId.resolves(room);
			userAdapter.getFederatedUsersByExternalIds.resolves([user1, user2]);
			service.usersTypingByRoomIdCache.set('externalRoomId', [
				{ externalUserId: 'id1', username: 'id1' },
				{ externalUserId: 'id2', username: 'id2' },
				{ externalUserId: 'id3', username: 'id3' },
				{ externalUserId: 'id4', username: 'id4' },
			]);
			await service.onUserTyping({
				externalRoomId: 'externalRoomId',
				externalUserIdsTyping: ['id1', 'id2'],
			} as any);

			notTypingAnymore.forEach((username) => {
				expect(notificationAdapter.notifyUserTypingOnRoom.calledWith('hexString', username, false)).to.be.true;
			});
			startedTyping.forEach((username) => {
				expect(notificationAdapter.notifyUserTypingOnRoom.calledWith('hexString', username, true)).to.be.true;
			});
			expect(service.usersTypingByRoomIdCache.get('externalRoomId')).to.deep.equal([
				{ externalUserId: 'id1', username: 'id1' },
				{ externalUserId: 'id2', username: 'id2' },
			]);
		});
	});
});

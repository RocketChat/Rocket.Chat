import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const { FederationUserServiceSender } = proxyquire
	.noCallThru()
	.load('../../../../../../../server/services/federation/application/user/sender/UserServiceSender', {
		mongodb: {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
	});

const { FederatedUser } = proxyquire.noCallThru().load('../../../../../../../server/services/federation/domain/FederatedUser', {
	mongodb: {
		'ObjectId': class ObjectId {
			toHexString(): string {
				return 'hexString';
			}
		},
		'@global': true,
	},
});

const { FederatedRoom } = proxyquire.noCallThru().load('../../../../../../../server/services/federation/domain/FederatedRoom', {
	mongodb: {
		'ObjectId': class ObjectId {
			toHexString(): string {
				return 'hexString';
			}
		},
		'@global': true,
	},
});

describe('Federation - Application - FederationUserServiceSender', () => {
	let service: typeof FederationUserServiceSender;
	const userAdapter = {
		getFederatedUserByExternalId: sinon.stub(),
		getFederatedUserByInternalId: sinon.stub(),
		getInternalUserById: sinon.stub(),
		updateFederationAvatar: sinon.stub(),
		getFederatedUserByInternalUsername: sinon.stub(),
		getInternalUserByUsername: sinon.stub(),
		createFederatedUser: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub().returns('localDomain'),
		isTypingStatusEnabled: sinon.stub(),
	};
	const fileAdapter = {
		getBufferForAvatarFile: sinon.stub(),
		getFileMetadataForAvatarFile: sinon.stub(),
	};
	const bridge = {
		uploadContent: sinon.stub(),
		setUserAvatar: sinon.stub(),
		notifyUserTyping: sinon.stub(),
		setUserDisplayName: sinon.stub(),
		createUser: sinon.stub(),
		getUserProfileInformation: sinon.stub(),
	};
	const roomAdapter = {
		getFederatedRoomByInternalId: sinon.stub(),
		setUserDisplayName: sinon.stub(),
		createUser: sinon.stub(),
		getUserProfileInformation: sinon.stub(),
	};

	beforeEach(() => {
		service = new FederationUserServiceSender(
			roomAdapter as any,
			userAdapter as any,
			fileAdapter as any,
			settingsAdapter as any,
			bridge as any,
		);
	});

	afterEach(() => {
		userAdapter.getFederatedUserByInternalId.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		userAdapter.updateFederationAvatar.reset();
		userAdapter.getInternalUserById.reset();
		userAdapter.getInternalUserByUsername.reset();
		userAdapter.getFederatedUserByInternalUsername.reset();
		userAdapter.createFederatedUser.reset();
		fileAdapter.getBufferForAvatarFile.reset();
		fileAdapter.getFileMetadataForAvatarFile.reset();
		bridge.uploadContent.reset();
		bridge.setUserAvatar.reset();
		bridge.notifyUserTyping.reset();
		settingsAdapter.isTypingStatusEnabled.reset();
		roomAdapter.getFederatedRoomByInternalId.reset();
		bridge.setUserDisplayName.reset();
		bridge.createUser.reset();
		bridge.getUserProfileInformation.reset();
	});

	describe('#afterUserAvatarChanged()', () => {
		const userAvatar = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});

		it('should NOT update the avatar externally if the user does not exists remotely nor locally', async () => {
			const spy = sinon.spy(service, 'createFederatedUserIncludingHomeserverUsingLocalInformation');
			userAdapter.getFederatedUserByInternalUsername.resolves(undefined);
			userAdapter.getInternalUserByUsername.resolves(undefined);
			await service.afterUserAvatarChanged({} as any);

			expect(fileAdapter.getBufferForAvatarFile.called).to.be.false;
			expect(spy.called).to.be.false;
		});

		it('should create a federated user first if it does not exists yet, but it does exists locally only (the case when the local user didnt have any contact with federation yet', async () => {
			const spy = sinon.spy(service, 'createFederatedUserIncludingHomeserverUsingLocalInformation');
			userAdapter.getFederatedUserByInternalUsername.resolves(undefined);
			userAdapter.getInternalUserById.resolves({ username: 'username' });
			userAdapter.getInternalUserByUsername.resolves({ _id: 'id' });
			await service.afterUserAvatarChanged({} as any);

			expect(spy.calledWith('id')).to.be.true;
		});

		it('should NOT update the avatar externally if the user exists but is from an external home server', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(
				FederatedUser.createInstance('externalInviterId', {
					name: 'normalizedInviterId',
					username: 'normalizedInviterId',
					existsOnlyOnProxyServer: false,
				}),
			);
			await service.afterUserAvatarChanged('username');

			expect(fileAdapter.getBufferForAvatarFile.called).to.be.false;
		});

		it('should NOT update the avatar externally if the buffer from the image does not exists', async () => {
			userAdapter.getFederatedUserByInternalUsername.resolves(userAvatar);
			fileAdapter.getBufferForAvatarFile.resolves(undefined);
			await service.afterUserAvatarChanged('username');

			expect(fileAdapter.getFileMetadataForAvatarFile.called).to.be.false;
		});

		it('should NOT update the avatar externally if the avatar metadata (type) does not exists locally', async () => {
			userAdapter.getFederatedUserByInternalUsername.resolves(userAvatar);
			fileAdapter.getBufferForAvatarFile.resolves({});
			fileAdapter.getFileMetadataForAvatarFile.resolves({ name: 'name' });
			await service.afterUserAvatarChanged('username');

			expect(bridge.uploadContent.called).to.be.false;
		});

		it('should NOT update the avatar externally if the avatar metadata (name) does not exists locally', async () => {
			userAdapter.getFederatedUserByInternalUsername.resolves(userAvatar);
			fileAdapter.getBufferForAvatarFile.resolves({});
			fileAdapter.getFileMetadataForAvatarFile.resolves({ type: 'type' });
			await service.afterUserAvatarChanged('username');

			expect(bridge.uploadContent.called).to.be.false;
		});

		it('should NOT update the avatar externally if the upload to the Matrix server didnt execute correctly', async () => {
			userAdapter.getFederatedUserByInternalUsername.resolves(userAvatar);
			fileAdapter.getBufferForAvatarFile.resolves({});
			fileAdapter.getFileMetadataForAvatarFile.resolves({ type: 'type', name: 'name' });
			bridge.uploadContent.resolves(undefined);
			await service.afterUserAvatarChanged('username');

			expect(userAdapter.updateFederationAvatar.called).to.be.false;
			expect(bridge.setUserAvatar.called).to.be.false;
		});

		it('should update the avatar externally correctly', async () => {
			userAdapter.getFederatedUserByInternalUsername.resolves(
				FederatedUser.createWithInternalReference('externalInviterId', true, {
					name: 'normalizedInviterId',
					username: 'normalizedInviterId',
					_id: '_id',
				}),
			);
			fileAdapter.getBufferForAvatarFile.resolves({});
			fileAdapter.getFileMetadataForAvatarFile.resolves({ type: 'type', name: 'name' });
			bridge.uploadContent.resolves('url');
			await service.afterUserAvatarChanged('username');

			expect(userAdapter.updateFederationAvatar.calledWith('_id', 'url')).to.be.true;
			expect(bridge.setUserAvatar.calledWith('externalInviterId', 'url')).to.be.true;
		});
	});

	describe('#afterUserRealNameChanged()', () => {
		it('should NOT update the name externally if the user does not exists remotely nor locally', async () => {
			const spy = sinon.spy(service, 'createFederatedUserIncludingHomeserverUsingLocalInformation');
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			userAdapter.getInternalUserById.resolves(undefined);
			await service.afterUserRealNameChanged('id', 'name');

			expect(bridge.setUserDisplayName.called).to.be.false;
			expect(spy.called).to.be.false;
		});

		it('should create a federated user first if it does not exists yet, but it does exists locally only (the case when the local user didnt have any contact with federation yet', async () => {
			const spy = sinon.spy(service, 'createFederatedUserIncludingHomeserverUsingLocalInformation');
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			userAdapter.getInternalUserById.resolves({ _id: 'id', username: 'username' });
			await service.afterUserRealNameChanged('id', 'name');

			expect(spy.calledWith('id')).to.be.true;
		});

		it('should NOT update the name externally if the user exists but is from an external home server', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(
				FederatedUser.createInstance('externalInviterId', {
					name: 'normalizedInviterId',
					username: 'normalizedInviterId',
					existsOnlyOnProxyServer: false,
				}),
			);
			await service.afterUserRealNameChanged('id', 'name');

			expect(bridge.setUserDisplayName.called).to.be.false;
		});

		it('should NOT update the name externally if the external username is equal to the current one', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(
				FederatedUser.createInstance('externalInviterId', {
					name: 'normalizedInviterId',
					username: 'normalizedInviterId',
					existsOnlyOnProxyServer: false,
				}),
			);
			bridge.getUserProfileInformation.resolves({ displayName: 'normalizedInviterId' });
			await service.afterUserRealNameChanged('id', 'name');

			expect(bridge.setUserDisplayName.called).to.be.false;
		});

		it('should update the name externally correctly', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(
				FederatedUser.createWithInternalReference('externalInviterId', true, {
					name: 'normalizedInviterId',
					username: 'normalizedInviterId',
					_id: '_id',
				}),
			);
			bridge.getUserProfileInformation.resolves({ displayName: 'different' });
			await service.afterUserRealNameChanged('id', 'name');

			expect(bridge.setUserDisplayName.calledWith('externalInviterId', 'name')).to.be.true;
		});
	});

	describe('#onUserTyping()', () => {
		const user = FederatedUser.createWithInternalReference('externalInviterId', true, {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			_id: '_id',
		});
		it('should NOT notify about the typing event externally if the setting is disabled', async () => {
			settingsAdapter.isTypingStatusEnabled.returns(false);
			await service.onUserTyping({} as any);

			expect(bridge.notifyUserTyping.called).to.be.false;
		});

		it('should NOT notify about the typing event externally if the user does not exists', async () => {
			settingsAdapter.isTypingStatusEnabled.returns(true);
			userAdapter.getFederatedUserByInternalUsername.resolves(undefined);
			await service.onUserTyping({} as any);

			expect(bridge.notifyUserTyping.called).to.be.false;
		});

		it('should NOT notify about the typing event externally if the room does not exists', async () => {
			settingsAdapter.isTypingStatusEnabled.returns(true);
			userAdapter.getFederatedUserByInternalUsername.resolves({});
			await service.onUserTyping({} as any);

			expect(bridge.notifyUserTyping.called).to.be.false;
		});

		it('should notify about the typing event externally correctly', async () => {
			const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');
			settingsAdapter.isTypingStatusEnabled.returns(true);
			userAdapter.getFederatedUserByInternalUsername.resolves(
				FederatedUser.createWithInternalReference('externalInviterId', true, {
					name: 'normalizedInviterId',
					username: 'normalizedInviterId',
					_id: '_id',
				}),
			);
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			const isTyping = true;
			await service.onUserTyping('internalUsername', 'internalRoomId', isTyping);

			expect(bridge.notifyUserTyping.calledWith(room.getExternalId(), user.getExternalId(), isTyping)).to.be.true;
		});
	});
});

import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { expect } from 'chai';
import sinon from 'sinon';

import { FederationRoomInternalHooksValidator } from '../../../../../../../../app/federation-v2/server/application/sender/RoomInternalHooksValidator';
import { FederatedRoom } from '../../../../../../../../app/federation-v2/server/domain/FederatedRoom';
import { FederatedUser } from '../../../../../../../../app/federation-v2/server/domain/FederatedUser';

describe('Federation - Application - FederationRoomInternalHooksValidator', () => {
	let service: FederationRoomInternalHooksValidator;
	const roomAdapter = {
		getFederatedRoomByInternalId: sinon.stub(),
		createFederatedRoom: sinon.stub(),
	};
	const userAdapter = {
		getFederatedUserByExternalId: sinon.stub(),
		getFederatedUserByInternalId: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub().returns('localDomain'),
	};
	const bridge = {
		extractHomeserverOrigin: sinon.stub(),
	};

	beforeEach(() => {
		service = new FederationRoomInternalHooksValidator(roomAdapter as any, userAdapter as any, settingsAdapter as any, bridge as any);
	});

	afterEach(() => {
		roomAdapter.getFederatedRoomByInternalId.reset();
		roomAdapter.createFederatedRoom.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		userAdapter.getFederatedUserByInternalId.reset();
		bridge.extractHomeserverOrigin.reset();
	});

	describe('#canAddFederatedUserToNonFederatedRoom()', () => {
		it('should NOT throw an error if the internal room is federated', async () => {
			await expect(service.canAddFederatedUserToNonFederatedRoom('external user', { federated: true } as any)).to.not.be.rejected;
		});

		it('should throw an error if the user is tryng to add an external user to a non federated room', async () => {
			await expect(service.canAddFederatedUserToNonFederatedRoom('external user', {} as any)).to.be.rejectedWith(
				'error-cant-add-federated-users',
			);
		});

		it('should NOT throw an error if the internal room is NOT federated but the user is adding a non federated user to it', async () => {
			userAdapter.getFederatedUserByExternalId.resolves(undefined);
			await expect(service.canAddFederatedUserToNonFederatedRoom({} as any, { federated: true } as any)).to.not.be.rejected;
		});

		it('should throw an error if the internal room is NOT federated and the user is trying to add a federated user to it', async () => {
			const user = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: false,
			});
			userAdapter.getFederatedUserByInternalId.resolves(user);
			await expect(service.canAddFederatedUserToNonFederatedRoom({} as any, {} as any)).to.be.rejectedWith(
				'error-cant-add-federated-users',
			);
		});
	});

	describe('#canAddFederatedUserToFederatedRoom()', () => {
		const user = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: false,
		});
		const room = FederatedRoom.createInstance('externalRoomId', 'normalizedRoomId', user, RoomType.CHANNEL, 'externalRoomName');
		it('should NOT throw an error if room is not federated', async () => {
			await expect(service.canAddFederatedUserToFederatedRoom('external user', {} as any, {} as any)).to.not.be.rejected;
		});

		it('should throw an error if the user is trying to add a new external user AND the room is not a DM', async () => {
			await expect(
				service.canAddFederatedUserToFederatedRoom('external user', {} as any, { federated: true, t: RoomType.CHANNEL } as any),
			).to.be.rejectedWith('error-this-is-an-ee-feature');
		});

		it('should NOT throw an error if the user is trying to add a new external user but the room is a DM', async () => {
			await expect(
				service.canAddFederatedUserToFederatedRoom('external user', {} as any, { federated: true, t: RoomType.DIRECT_MESSAGE } as any),
			).to.not.be.rejected;
		});

		it('should NOT throw an error if there is no existent federated room', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(undefined);
			await expect(service.canAddFederatedUserToFederatedRoom({} as any, {} as any, { federated: true } as any)).to.not.be.rejected;
		});

		it('should NOT throw an error if there is no existent inviter user', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await expect(service.canAddFederatedUserToFederatedRoom({} as any, {} as any, { federated: true } as any)).to.not.be.rejected;
		});

		it('should NOT throw an error if the whole action(external room + external inviter) is executed remotely', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			bridge.extractHomeserverOrigin.returns('externalDomain');
			await expect(service.canAddFederatedUserToFederatedRoom({} as any, {} as any, { federated: true } as any)).to.not.be.rejected;
		});

		it('should NOT throw an error if the user is trying to add an external user AND the room is a direct message one', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			bridge.extractHomeserverOrigin.returns('localDomain');
			await expect(service.canAddFederatedUserToFederatedRoom({} as any, {} as any, { federated: true, t: RoomType.DIRECT_MESSAGE } as any))
				.to.not.be.rejected;
		});

		it('should NOT throw an error if the user is trying to add a NON external user AND the room is a direct message one', async () => {
			const localUser = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: true,
			});
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(localUser);
			bridge.extractHomeserverOrigin.returns('localDomain');
			await expect(service.canAddFederatedUserToFederatedRoom({} as any, {} as any, { federated: true, t: RoomType.DIRECT_MESSAGE } as any))
				.to.not.be.rejected;
		});

		it('should NOT throw an error if the user is trying to add a NON external user AND the room is a NOT direct message one', async () => {
			const localUser = FederatedUser.createInstance('externalInviterId', {
				name: 'normalizedInviterId',
				username: 'normalizedInviterId',
				existsOnlyOnProxyServer: true,
			});
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(localUser);
			bridge.extractHomeserverOrigin.returns('localDomain');
			await expect(service.canAddFederatedUserToFederatedRoom({} as any, {} as any, { federated: true, t: RoomType.CHANNEL } as any)).to.not
				.be.rejected;
		});

		it('should throw an error if the user is trying to add an external user AND the room is a NOT direct message one', async () => {
			roomAdapter.getFederatedRoomByInternalId.resolves(room);
			userAdapter.getFederatedUserByInternalId.resolves(user);
			bridge.extractHomeserverOrigin.returns('localDomain');
			await expect(
				service.canAddFederatedUserToFederatedRoom({} as any, {} as any, { federated: true, t: RoomType.CHANNEL } as any),
			).to.be.rejectedWith('error-this-is-an-ee-feature');
		});
	});

	describe('#canCreateDirectMessageFromUI()', () => {
		it('should throw an error if there at least one user with federated property equal to true', async () => {
			try {
				await service.canCreateDirectMessageFromUI([{ federated: true } as any, {} as any]);
			} catch (e: any) {
				expect(e.message).to.be.equal('error-this-is-an-ee-feature');
			}
		});

		it('should throw an error if there at least one new external user (comaring by username, even if federated is equal false)', async () => {
			bridge.extractHomeserverOrigin.returns('localDomain');
			try {
				await service.canCreateDirectMessageFromUI(['@myexternal:external.com', {} as any]);
			} catch (e: any) {
				expect(e.message).to.be.equal('error-this-is-an-ee-feature');
			}
		});
	});
});

import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

const { FederationUserServiceSender } = proxyquire
	.noCallThru()
	.load('../../../../../../../../app/federation-v2/server/application/sender/UserServiceSender', {
		mongodb: {
			'ObjectId': class ObjectId {
				toHexString(): string {
					return 'hexString';
				}
			},
			'@global': true,
		},
	});

const { FederatedUser } = proxyquire.noCallThru().load('../../../../../../../../app/federation-v2/server/domain/FederatedUser', {
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
		updateFederationAvatar: sinon.stub(),
	};
	const settingsAdapter = {
		getHomeServerDomain: sinon.stub().returns('localDomain'),
	};
	const fileAdapter = {
		getBufferForAvatarFile: sinon.stub(),
		getFileMetadataForAvatarFile: sinon.stub(),
	};
	const bridge = {
		uploadContent: sinon.stub(),
		setUserAvatar: sinon.stub(),
	};

	beforeEach(() => {
		service = new FederationUserServiceSender(userAdapter as any, fileAdapter as any, settingsAdapter as any, bridge as any);
	});

	afterEach(() => {
		userAdapter.getFederatedUserByInternalId.reset();
		userAdapter.getFederatedUserByExternalId.reset();
		userAdapter.updateFederationAvatar.reset();
		fileAdapter.getBufferForAvatarFile.reset();
		fileAdapter.getFileMetadataForAvatarFile.reset();
		bridge.uploadContent.reset();
		bridge.setUserAvatar.reset();
	});

	describe('#afterUserAvatarChanged()', () => {
		const userAvatar = FederatedUser.createInstance('externalInviterId', {
			name: 'normalizedInviterId',
			username: 'normalizedInviterId',
			existsOnlyOnProxyServer: true,
		});
		it('should NOT update the avatar externally if the user does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(undefined);
			await service.afterUserAvatarChanged({} as any);

			expect(fileAdapter.getBufferForAvatarFile.called).to.be.false;
		});

		it('should NOT update the avatar externally if the user exists but is from an external home server', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(
				FederatedUser.createInstance('externalInviterId', {
					name: 'normalizedInviterId',
					username: 'normalizedInviterId',
					existsOnlyOnProxyServer: false,
				}),
			);
			await service.afterUserAvatarChanged({ username: 'username' } as any);

			expect(fileAdapter.getBufferForAvatarFile.called).to.be.false;
		});

		it('should NOT update the avatar externally if the username does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(userAvatar);
			await service.afterUserAvatarChanged({} as any);

			expect(fileAdapter.getBufferForAvatarFile.called).to.be.false;
		});

		it('should NOT update the avatar externally if the buffer from the image does not exists', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(userAvatar);
			fileAdapter.getBufferForAvatarFile.resolves(undefined);
			await service.afterUserAvatarChanged({ username: 'username' } as any);

			expect(fileAdapter.getFileMetadataForAvatarFile.called).to.be.false;
		});

		it('should NOT update the avatar externally if the avatar metadata (type) does not exists locally', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(userAvatar);
			fileAdapter.getBufferForAvatarFile.resolves({});
			fileAdapter.getFileMetadataForAvatarFile.resolves({ name: 'name' });
			await service.afterUserAvatarChanged({ username: 'username' } as any);

			expect(bridge.uploadContent.called).to.be.false;
		});

		it('should NOT update the avatar externally if the avatar metadata (name) does not exists locally', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(userAvatar);
			fileAdapter.getBufferForAvatarFile.resolves({});
			fileAdapter.getFileMetadataForAvatarFile.resolves({ type: 'type' });
			await service.afterUserAvatarChanged({ username: 'username' } as any);

			expect(bridge.uploadContent.called).to.be.false;
		});

		it('should NOT update the avatar externally if the upload to the Matrix server didnt execute correctly', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(userAvatar);
			fileAdapter.getBufferForAvatarFile.resolves({});
			fileAdapter.getFileMetadataForAvatarFile.resolves({ type: 'type', name: 'name' });
			bridge.uploadContent.resolves(undefined);
			await service.afterUserAvatarChanged({ username: 'username' } as any);

			expect(userAdapter.updateFederationAvatar.called).to.be.false;
			expect(bridge.setUserAvatar.called).to.be.false;
		});

		it('should update the avatar externally correctly', async () => {
			userAdapter.getFederatedUserByInternalId.resolves(userAvatar);
			fileAdapter.getBufferForAvatarFile.resolves({});
			fileAdapter.getFileMetadataForAvatarFile.resolves({ type: 'type', name: 'name' });
			bridge.uploadContent.resolves('url');
			await service.afterUserAvatarChanged({ username: 'username', _id: '_id' } as any);

			expect(userAdapter.updateFederationAvatar.calledWith('_id', 'url')).to.be.true;
			expect(bridge.setUserAvatar.calledWith('externalInviterId', 'url')).to.be.true;
		});
	});
});

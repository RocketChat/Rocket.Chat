import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { FederationService } from '../../../../../../app/federation-v2/server/application/AbstractFederationService';
import { RocketChatSettingsAdapter } from '../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { FederatedRoomEE } from '../../domain/FederatedRoom';
import { FederatedUserEE } from '../../domain/FederatedUser';
import { IFederationBridgeEE } from '../../domain/IFederationBridge';
import { RocketChatNotificationAdapter } from '../../infrastructure/rocket-chat/adapters/Notification';
import { RocketChatRoomAdapterEE } from '../../infrastructure/rocket-chat/adapters/Room';
import { RocketChatUserAdapterEE } from '../../infrastructure/rocket-chat/adapters/User';
import {
	FederationBeforeAddUserToARoomDto,
	FederationOnRoomCreationDto,
	FederationOnUsersAddedToARoomDto,
	FederationRoomInviteUserDto,
	FederationSetupRoomDto,
} from '../input/RoomSenderDto';

export class FederationRoomInternalHooksServiceSender extends FederationService {
	constructor(
		protected rocketRoomAdapter: RocketChatRoomAdapterEE,
		protected rocketUserAdapter: RocketChatUserAdapterEE,
		protected rocketSettingsAdapter: RocketChatSettingsAdapter,
		protected rocketNotificationAdapter: RocketChatNotificationAdapter,
		protected bridge: IFederationBridgeEE,
	) {
		super(bridge, rocketUserAdapter, rocketSettingsAdapter);
	}

	public async onRoomCreated(roomOnCreationInput: FederationOnRoomCreationDto): Promise<void> {
		const { internalInviterId, internalRoomId, invitees } = roomOnCreationInput;
		await this.setupFederatedRoom({ internalInviterId, internalRoomId });

		if (invitees.length === 0) {
			return;
		}
		await Promise.all(
			invitees.map((member) =>
				this.inviteUserToAFederatedRoom({
					internalInviterId,
					internalRoomId,
					inviteeUsernameOnly: member.inviteeUsernameOnly,
					normalizedInviteeId: member.normalizedInviteeId,
					rawInviteeId: member.rawInviteeId,
				}),
			),
		);
	}

	public async beforeAddUserToARoom(dmBeforeAddUserToARoomInput: FederationBeforeAddUserToARoomDto): Promise<void> {
		const { invitees = [] } = dmBeforeAddUserToARoomInput;
		if (invitees.length === 0) {
			return;
		}

		const externalUsersToBeCreatedLocally = invitees.filter(
			(invitee) =>
				!FederatedUserEE.isAnInternalUser(this.bridge.extractHomeserverOrigin(invitee.rawInviteeId), this.internalHomeServerDomain),
		);

		await Promise.all(
			externalUsersToBeCreatedLocally.map((invitee) =>
				this.rocketUserAdapter.createLocalUser(
					FederatedUserEE.createLocalInstanceOnly({
						username: invitee.normalizedInviteeId,
						name: invitee.normalizedInviteeId,
						existsOnlyOnProxyServer: false,
					}),
				),
			),
		);
	}

	public async onUsersAddedToARoom(roomOnUsersAddedToARoomInput: FederationOnUsersAddedToARoomDto): Promise<void> {
		const { internalInviterId, internalRoomId, invitees, inviteComesFromAnExternalHomeServer } = roomOnUsersAddedToARoomInput;

		if (inviteComesFromAnExternalHomeServer) {
			return;
		}

		await Promise.all(
			invitees.map((member) =>
				this.inviteUserToAFederatedRoom({
					internalInviterId,
					internalRoomId,
					inviteeUsernameOnly: member.inviteeUsernameOnly,
					normalizedInviteeId: member.normalizedInviteeId,
					rawInviteeId: member.rawInviteeId,
				}),
			),
		);
	}

	public async afterRoomNameChanged(internalRoomId: string, internalRoomName: string): Promise<void> {
		const federatedRoom = await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser = await this.rocketUserAdapter.getFederatedUserByInternalId(federatedRoom.getInternalCreator()._id);
		if (!federatedUser) {
			return;
		}

		const isRoomFromTheSameHomeServer = FederatedRoomEE.isAnInternalRoom(
			this.bridge.extractHomeserverOrigin(federatedRoom.getExternalId()),
			this.rocketSettingsAdapter.getHomeServerDomain(),
		);
		if (!isRoomFromTheSameHomeServer) {
			return;
		}

		const externalRoomName = await this.bridge.getRoomName(federatedRoom.getExternalId(), federatedUser.getExternalId());

		if (!federatedRoom.shouldUpdateRoomName(externalRoomName || '')) {
			return;
		}

		await this.bridge.setRoomName(federatedRoom.getExternalId(), federatedUser.getExternalId(), internalRoomName);
	}

	public async afterRoomTopicChanged(internalRoomId: string, internalRoomTopic: string): Promise<void> {
		const federatedRoom = await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			return;
		}

		const federatedUser = await this.rocketUserAdapter.getFederatedUserByInternalId(federatedRoom.getInternalCreator()._id);
		if (!federatedUser) {
			return;
		}

		const isRoomFromTheSameHomeServer = FederatedRoomEE.isAnInternalRoom(
			this.bridge.extractHomeserverOrigin(federatedRoom.getExternalId()),
			this.rocketSettingsAdapter.getHomeServerDomain(),
		);
		if (!isRoomFromTheSameHomeServer) {
			return;
		}

		const externalRoomTopic = await this.bridge.getRoomTopic(federatedRoom.getExternalId(), federatedUser.getExternalId());
		if (!federatedRoom.shouldUpdateRoomName(externalRoomTopic || '')) {
			return;
		}

		await this.bridge.setRoomTopic(federatedRoom.getExternalId(), federatedUser.getExternalId(), internalRoomTopic);
	}

	private async setupFederatedRoom(roomInviteUserInput: FederationSetupRoomDto): Promise<void> {
		const { internalInviterId, internalRoomId } = roomInviteUserInput;

		const inviterUser = await this.rocketUserAdapter.getFederatedUserByInternalId(internalInviterId);
		if (!inviterUser) {
			await this.createFederatedUserForInviterUsingLocalInformation(internalInviterId);
		}

		const federatedInviterUser = inviterUser || (await this.rocketUserAdapter.getFederatedUserByInternalId(internalInviterId));
		if (!federatedInviterUser) {
			throw new Error(`User with internalId ${ internalInviterId } not found`);
		}

		const internalFederatedRoom = await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (internalFederatedRoom) {
			return;
		}
		const internalRoom = await this.rocketRoomAdapter.getInternalRoomById(internalRoomId);
		if (!internalRoom || !internalRoom.name) {
			throw new Error(`Room with internalId ${ internalRoomId } not found`);
		}
		const roomName = internalRoom.fname || internalRoom.name;
		const externalRoomId = await this.bridge.createRoom(federatedInviterUser.getExternalId(), internalRoom.t, roomName, internalRoom.topic);

		await this.rocketRoomAdapter.updateFederatedRoomByInternalRoomId(internalRoom._id, externalRoomId);
	}

	private async inviteUserToAFederatedRoom(roomInviteUserInput: FederationRoomInviteUserDto): Promise<void> {
		const { internalInviterId, internalRoomId, normalizedInviteeId, inviteeUsernameOnly, rawInviteeId } = roomInviteUserInput;

		const isInviteeFromTheSameHomeServer = FederatedUserEE.isAnInternalUser(
			this.bridge.extractHomeserverOrigin(rawInviteeId),
			this.internalHomeServerDomain,
		);

		const federatedRoom = await this.rocketRoomAdapter.getFederatedRoomByInternalId(internalRoomId);
		if (!federatedRoom) {
			throw new Error(`Could not find the room to invite. RoomId: ${ internalRoomId }`);
		}

		const federatedInviterUser = await this.rocketUserAdapter.getFederatedUserByInternalId(internalInviterId);
		if (!federatedInviterUser) {
			throw new Error(`User with internalId ${ internalInviterId } not found`);
		}

		const username = isInviteeFromTheSameHomeServer ? inviteeUsernameOnly : normalizedInviteeId;
		const inviteeUser = await this.rocketUserAdapter.getFederatedUserByInternalUsername(username);
		if (!inviteeUser) {
			const existsOnlyOnProxyServer = isInviteeFromTheSameHomeServer;
			await this.createFederatedUser(rawInviteeId, username, existsOnlyOnProxyServer);
		}

		const federatedInviteeUser = inviteeUser || (await this.rocketUserAdapter.getFederatedUserByInternalUsername(username));
		if (!federatedInviteeUser) {
			throw new Error(`User with internalUsername ${ username } not found`);
		}

		if (isInviteeFromTheSameHomeServer) {
			const profile = await this.bridge.getUserProfileInformation(federatedInviteeUser.getExternalId());
			if (!profile) {
				await this.bridge.createUser(
					inviteeUsernameOnly,
					federatedInviteeUser.getName() || federatedInviteeUser.getUsername() || username,
					this.internalHomeServerDomain,
				);
			}
		}
		
		await this.bridge.inviteToRoom(federatedRoom.getExternalId(), federatedInviterUser.getExternalId(), federatedInviteeUser.getExternalId());
	}
}

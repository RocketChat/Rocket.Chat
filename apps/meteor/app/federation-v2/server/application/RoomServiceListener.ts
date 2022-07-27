import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { FederatedRoom } from '../domain/FederatedRoom';
import { FederatedUser } from '../domain/FederatedUser';
import { EVENT_ORIGIN, IFederationBridge } from '../domain/IFederationBridge';
import { RocketChatMessageAdapter } from '../infrastructure/rocket-chat/adapters/Message';
import { RocketChatRoomAdapter } from '../infrastructure/rocket-chat/adapters/Room';
import { RocketChatSettingsAdapter } from '../infrastructure/rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from '../infrastructure/rocket-chat/adapters/User';
import {
	FederationRoomCreateInputDto,
	FederationRoomChangeMembershipDto,
	FederationRoomReceiveExternalMessageDto,
	FederationRoomChangeJoinRulesDto,
	FederationRoomChangeNameDto,
	FederationRoomChangeTopicDto,
} from './input/RoomReceiverDto';
import { FederationService } from './AbstractFederationService';

export class FederationRoomServiceListener extends FederationService {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapter,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalMessageAdapter: RocketChatMessageAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalSettingsAdapter);
	}

	public async onCreateRoom(roomCreateInput: FederationRoomCreateInputDto): Promise<void> {
		const {
			externalRoomId,
			externalInviterId,
			normalizedInviterId,
			externalRoomName,
			normalizedRoomId,
			roomType,
			wasInternallyProgramaticallyCreated = false,
		} = roomCreateInput;

		if ((await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId)) || wasInternallyProgramaticallyCreated) {
			return;
		}

		const creatorUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalInviterId);
		if (!creatorUser) {
			await this.createFederatedUser(externalInviterId, normalizedInviterId);
			// const externalUserProfileInformation = await this.bridge.getUserProfileInformation(externalInviterId);
			// const name = externalUserProfileInformation?.displayName || normalizedInviterId;
			// const federatedCreatorUser = FederatedUser.createInstance(externalInviterId, {
			// 	name,
			// 	username: normalizedInviterId,
			// 	existsOnlyOnProxyServer: false,
			// });

			// await this.rocketUserAdapter.createFederatedUser(federatedCreatorUser);
		}
		const creator = creatorUser || await this.internalUserAdapter.getFederatedUserByExternalId(externalInviterId);
		if (!creator) {
			throw new Error('Creator user not found');
		}
		const newFederatedRoom = FederatedRoom.createInstance(
			externalRoomId,
			normalizedRoomId,
			creator,
			roomType || RoomType.CHANNEL,
			externalRoomName,
		);
		await this.internalRoomAdapter.createFederatedRoom(newFederatedRoom);
	}

	public async onChangeRoomMembership(roomChangeMembershipInput: FederationRoomChangeMembershipDto): Promise<void> {
		const {
			externalRoomId,
			normalizedInviteeId,
			normalizedRoomId,
			normalizedInviterId,
			externalRoomName,
			externalInviteeId,
			externalInviterId,
			inviteeUsernameOnly,
			inviterUsernameOnly,
			eventOrigin,
			roomType = RoomType.CHANNEL,
			leave,
		} = roomChangeMembershipInput;
		const wasGeneratedOnTheProxyServer = eventOrigin === EVENT_ORIGIN.LOCAL;
		const affectedFederatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);

		if (wasGeneratedOnTheProxyServer && !affectedFederatedRoom) {
			throw new Error(`Could not find room with external room id: ${ externalRoomId }`);
		}

		// const isInviterFromTheSameHomeServer = this.bridge.isUserIdFromTheSameHomeserver(
		// 	externalInviterId,
		// 	this.rocketSettingsAdapter.getHomeServerDomain(),
		// );
		// const isInviteeFromTheSameHomeServer = this.bridge.isUserIdFromTheSameHomeserver(
		// 	externalInviteeId,
		// 	this.rocketSettingsAdapter.getHomeServerDomain(),
		// );
		const internalHomeServerDomain = this.internalSettingsAdapter.getHomeServerDomain();

		const isInviterFromTheSameHomeServer = FederatedUser.isAnInternalUser(
			this.bridge.extractHomeserverOrigin(externalInviterId),
			internalHomeServerDomain,
		);
		const isInviteeFromTheSameHomeServer = FederatedUser.isAnInternalUser(
			this.bridge.extractHomeserverOrigin(externalInviteeId),
			internalHomeServerDomain,
		);
		const defaultInviterUsername = isInviterFromTheSameHomeServer ? inviterUsernameOnly : normalizedInviterId;
		const defaultInviteeUsername = isInviteeFromTheSameHomeServer ? inviteeUsernameOnly : normalizedInviteeId;

		const inviterUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalInviterId);
		if (!inviterUser) {
			await this.createFederatedUser(externalInviterId, defaultInviterUsername, isInviterFromTheSameHomeServer);
			// const externalUserProfileInformation = await this.bridge.getUserProfileInformation(externalInviterId);
			// const name = externalUserProfileInformation?.displayName || normalizedInviterId;
			// const federatedCreatorUser = FederatedUser.createInstance(externalInviterId, {
			// 	name,
			// 	username: normalizedInviterId,
			// 	existsOnlyOnProxyServer: false,
			// });

			// await this.rocketUserAdapter.createFederatedUser(federatedCreatorUser);
		}
		// if (!(await this.rocketUserAdapter.getFederatedUserByExternalId(externalInviterId))) {
		// 	const externalUserProfileInformation = await this.bridge.getUserProfileInformation(externalInviterId);
		// 	const name = externalUserProfileInformation?.displayName || normalizedInviterId;
		// 	const federatedInviterUser = FederatedUser.createInstance(externalInviterId, {
		// 		name,
		// 		username,
		// 		existsOnlyOnProxyServer: isInviterFromTheSameHomeServer,
		// 	});

		// 	await this.rocketUserAdapter.createFederatedUser(federatedInviterUser);
		// }
		// if (!(await this.rocketUserAdapter.getFederatedUserByExternalId(externalInviterId))) {
		// 	const externalUserProfileInformation = await this.bridge.getUserProfileInformation(externalInviterId);
		// 	const name = externalUserProfileInformation?.displayName || normalizedInviterId;
		// 	const username = isInviterFromTheSameHomeServer ? inviterUsernameOnly : normalizedInviterId;
		// 	const federatedInviterUser = FederatedUser.createInstance(externalInviterId, {
		// 		name,
		// 		username,
		// 		existsOnlyOnProxyServer: isInviterFromTheSameHomeServer,
		// 	});

		// 	await this.rocketUserAdapter.createFederatedUser(federatedInviterUser);
		// }

		// if (!(await this.rocketUserAdapter.getFederatedUserByExternalId(externalInviteeId))) {
		// 	const externalUserProfileInformation = await this.bridge.getUserProfileInformation(externalInviteeId);
		// 	const name = externalUserProfileInformation?.displayName || normalizedInviteeId;
		// 	const username = isInviteeFromTheSameHomeServer ? inviteeUsernameOnly : normalizedInviteeId;
		// 	const federatedInviteeUser = FederatedUser.createInstance(externalInviteeId, {
		// 		name,
		// 		username,
		// 		existsOnlyOnProxyServer: isInviteeFromTheSameHomeServer,
		// 	});

		// 	await this.rocketUserAdapter.createFederatedUser(federatedInviteeUser);
		// }

		const inviteeUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalInviteeId);
		if (!inviteeUser) {
			const username = isInviteeFromTheSameHomeServer ? inviteeUsernameOnly : normalizedInviteeId;
			await this.createFederatedUser(externalInviteeId, username, isInviteeFromTheSameHomeServer);
			// const externalUserProfileInformation = await this.bridge.getUserProfileInformation(externalInviterId);
			// const name = externalUserProfileInformation?.displayName || normalizedInviterId;
			// const federatedCreatorUser = FederatedUser.createInstance(externalInviterId, {
			// 	name,
			// 	username: normalizedInviterId,
			// 	existsOnlyOnProxyServer: false,
			// });

			// await this.rocketUserAdapter.createFederatedUser(federatedCreatorUser);
		}
		// if (!(await this.rocketUserAdapter.getFederatedUserByExternalId(externalInviteeId))) {
		// 	const externalUserProfileInformation = await this.bridge.getUserProfileInformation(externalInviteeId);
		// 	const name = externalUserProfileInformation?.displayName || normalizedInviteeId;
		// 	const username = isInviteeFromTheSameHomeServer ? inviteeUsernameOnly : normalizedInviteeId;
		// 	const federatedInviteeUser = FederatedUser.createInstance(externalInviteeId, {
		// 		name,
		// 		username,
		// 		existsOnlyOnProxyServer: isInviteeFromTheSameHomeServer,
		// 	});

		// 	await this.rocketUserAdapter.createFederatedUser(federatedInviteeUser);
		// }
		const federatedInviteeUser = inviteeUser || await this.internalUserAdapter.getFederatedUserByExternalId(externalInviteeId);
		const federatedInviterUser = inviterUser || await this.internalUserAdapter.getFederatedUserByExternalId(externalInviterId);

		if (!federatedInviteeUser || !federatedInviterUser) {
			throw new Error('Invitee or inviter user not found');
		}
		
		if (!wasGeneratedOnTheProxyServer && !affectedFederatedRoom) {
			const members = [federatedInviterUser, federatedInviteeUser];
			const newFederatedRoom = FederatedRoom.createInstance(
				externalRoomId,
				normalizedRoomId,
				federatedInviterUser,
				roomType,
				externalRoomName,
				members,
			);

			await this.internalRoomAdapter.createFederatedRoom(newFederatedRoom);
			await this.bridge.joinRoom(externalRoomId, externalInviteeId);
		}

		const federatedRoom = affectedFederatedRoom || (await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId));
		if (!federatedRoom) {
			throw new Error(`Could not find room with external room id: ${ externalRoomId }`);
		}

		if (leave) {
			// TODO: check if this is possible to move to the domain layer
			const isInviteeAlreadyJoinedInternalRoom = await this.internalRoomAdapter.isUserAlreadyJoined(federatedRoom.internalReference?._id, federatedInviteeUser?.internalReference?._id);
			// if (
			// 	!(await this.internalRoomAdapter.isUserAlreadyJoined(
			// 		federatedRoom.internalReference?._id,
			// 		federatedInviteeUser?.internalReference?._id,
			// 	))
			// ) {
			// 	return;
			// }

			isInviteeAlreadyJoinedInternalRoom && await this.internalRoomAdapter.removeUserFromRoom(federatedRoom, federatedInviteeUser, federatedInviterUser);
			return;
		}
		// if (!wasGeneratedOnTheProxyServer && affectedFederatedRoom.isDirectMessage()) {
		// 	const membersUsernames: string[] = [
		// 		...(affectedFederatedRoom.internalReference?.usernames || []),
		// 		federatedInviteeUser?.internalReference?.username || '',
		// 	];
		// 	const newFederatedRoom = FederatedRoom.createInstance(
		// 		externalRoomId,
		// 		normalizedRoomId,
		// 		federatedInviterUser,
		// 		RoomType.DIRECT_MESSAGE,
		// 		externalRoomName,
		// 	);
		// 	if (affectedFederatedRoom.internalReference?.usernames?.includes(federatedInviteeUser?.internalReference.username || '')) {
		// 		return;
		// 	}
		// 	await this.internalRoomAdapter.removeDirectMessageRoom(affectedFederatedRoom);
		// 	await this.internalRoomAdapter.createFederatedRoomForDirectMessage(newFederatedRoom, membersUsernames.filter(Boolean));
		// 	return;
		// }
		if (!wasGeneratedOnTheProxyServer && federatedRoom.isDirectMessage() && !federatedRoom.isUserPartOfTheRoom(federatedInviteeUser)) {
			// TODO: leaked business logic, revisit this to move to domain layer
			const membersUsernames = [
				...federatedRoom.getMembersUsernames(),
				federatedInviteeUser.getUsername() || defaultInviteeUsername,
			];
			const newFederatedRoom = FederatedRoom.createInstance(
				externalRoomId,
				normalizedRoomId,
				federatedInviterUser,
				RoomType.DIRECT_MESSAGE,
				externalRoomName,
			);
			// if (federatedRoom.internalReference?.usernames?.includes(federatedInviteeUser?.internalReference.username || '')) {
			// 	return;
			// }
			// if (federatedRoom.isUserPartOfTheRoom(federatedInviteeUser)) {
			// 	return;
			// }
			// await this.internalRoomAdapter.removeDirectMessageRoom(federatedRoom);
			await this.internalRoomAdapter.createFederatedRoomForDirectMessage(newFederatedRoom, membersUsernames);
			return;
		}

		await this.internalRoomAdapter.addUserToRoom(federatedRoom, federatedInviteeUser, federatedInviterUser);
	}

	public async onExternalMessageReceived(roomReceiveExternalMessageInput: FederationRoomReceiveExternalMessageDto): Promise<void> {
		const { externalRoomId, externalSenderId, messageText } = roomReceiveExternalMessageInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		const senderUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!senderUser) {
			return;
		}

		await this.internalMessageAdapter.sendMessage(senderUser, federatedRoom, messageText);
	}

	public async onChangeJoinRules(roomJoinRulesChangeInput: FederationRoomChangeJoinRulesDto): Promise<void> {
		const { externalRoomId, roomType } = roomJoinRulesChangeInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		const notAllowedChangeJoinRules = federatedRoom.isDirectMessage();
		if (notAllowedChangeJoinRules) {
			return;
		}

		federatedRoom.setRoomType(roomType);
		await this.internalRoomAdapter.updateRoomType(federatedRoom);
	}

	public async onChangeRoomName(roomChangeNameInput: FederationRoomChangeNameDto): Promise<void> {
		const { externalRoomId, normalizedRoomName, externalSenderId } = roomChangeNameInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		if (!federatedRoom.shouldUpdateRoomName(normalizedRoomName)) {
			return;
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!federatedUser) {
			return;
		}

		federatedRoom.changeRoomName(normalizedRoomName);

		await this.internalRoomAdapter.updateRoomName(federatedRoom, federatedUser);
	}

	public async onChangeRoomTopic(roomChangeTopicInput: FederationRoomChangeTopicDto): Promise<void> {
		const { externalRoomId, roomTopic, externalSenderId } = roomChangeTopicInput;

		const federatedRoom = await this.internalRoomAdapter.getFederatedRoomByExternalId(externalRoomId);
		if (!federatedRoom) {
			return;
		}

		if (!federatedRoom.shouldUpdateRoomTopic(roomTopic)) {
			return;
		}

		const federatedUser = await this.internalUserAdapter.getFederatedUserByExternalId(externalSenderId);
		if (!federatedUser) {
			return;
		}

		federatedRoom.changeRoomTopic(roomTopic);

		await this.internalRoomAdapter.updateRoomTopic(federatedRoom, federatedUser);
	}

}

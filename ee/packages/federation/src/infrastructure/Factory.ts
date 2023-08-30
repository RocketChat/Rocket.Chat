import type { IMessage, IRoom, IUser, Username } from '@rocket.chat/core-typings';

import { FederationMessageServiceReceiver } from '../application/room/message/receiver/MessageServiceReceiver';
import { FederationMessageServiceSender } from '../application/room/message/sender/MessageServiceSender';
import { FederationRoomServiceReceiver } from '../application/room/receiver/RoomServiceReceiver';
import { FederationDirectMessageRoomServiceSender } from '../application/room/sender/DirectMessageRoomServiceSender';
import { FederationRoomInternalValidator } from '../application/room/sender/RoomInternalValidator';
import { FederationRoomServiceSender } from '../application/room/sender/RoomServiceSender';
import { FederationUserService } from '../application/user/UserService';
import { FederationUserServiceReceiver } from '../application/user/receiver/UserServiceReceiver';
import { FederationUserServiceSender } from '../application/user/sender/UserServiceSender';
import type { IFederationBridge } from '../domain/IFederationBridge';
import { MatrixBridge } from './matrix/Bridge';
import { MatrixEventsHandler } from './matrix/handlers';
import type { MatrixBaseEventHandler } from './matrix/handlers/BaseEvent';
import { MatrixMessageReactedHandler } from './matrix/handlers/Message';
import {
	MatrixRoomCreatedHandler,
	MatrixRoomEventRedactedHandler,
	MatrixRoomJoinRulesChangedHandler,
	MatrixRoomMembershipChangedHandler,
	MatrixRoomMessageSentHandler,
	MatrixRoomNameChangedHandler,
	MatrixRoomPowerLevelsChangedHandler,
	MatrixRoomTopicChangedHandler,
} from './matrix/handlers/Room';
import { MatrixUserTypingStatusChangedHandler } from './matrix/handlers/User';
import { InMemoryQueue } from './queue/InMemoryQueue';
import { RocketChatFileAdapter } from './rocket-chat/adapters/File';
import { RocketChatMessageAdapter } from './rocket-chat/adapters/Message';
import { RocketChatNotificationAdapter } from './rocket-chat/adapters/Notification';
import { RocketChatQueueAdapter } from './rocket-chat/adapters/Queue';
import { RocketChatRoomAdapter } from './rocket-chat/adapters/Room';
import { RocketChatSettingsAdapter } from './rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from './rocket-chat/adapters/User';
import { FederationRoomSenderConverter } from './rocket-chat/converters/RoomSender';
import { FederationHooks } from './rocket-chat/hooks';

export class FederationFactory {
	public static buildInternalSettingsAdapter(): RocketChatSettingsAdapter {
		return new RocketChatSettingsAdapter();
	}

	public static buildInternalRoomAdapter(): RocketChatRoomAdapter {
		return new RocketChatRoomAdapter();
	}

	public static buildInternalUserAdapter(): RocketChatUserAdapter {
		return new RocketChatUserAdapter();
	}

	public static buildInternalMessageAdapter(): RocketChatMessageAdapter {
		return new RocketChatMessageAdapter();
	}

	public static buildInternalFileAdapter(): RocketChatFileAdapter {
		return new RocketChatFileAdapter();
	}

	public static buildInternalQueueAdapter(): RocketChatQueueAdapter {
		return new RocketChatQueueAdapter();
	}

	public static buildInternalNotificationAdapter(): RocketChatNotificationAdapter {
		return new RocketChatNotificationAdapter();
	}

	public static buildFederationQueue(): InMemoryQueue {
		return new InMemoryQueue();
	}

	public static buildRoomServiceReceiver(
		internalRoomAdapter: RocketChatRoomAdapter,
		internalUserAdapter: RocketChatUserAdapter,
		internalMessageAdapter: RocketChatMessageAdapter,
		internalFileAdapter: RocketChatFileAdapter,
		internalSettingsAdapter: RocketChatSettingsAdapter,
		internalNotificationAdapter: RocketChatNotificationAdapter,
		federationQueueInstance: InMemoryQueue,
		bridge: IFederationBridge,
	): FederationRoomServiceReceiver {
		return new FederationRoomServiceReceiver(
			internalRoomAdapter,
			internalUserAdapter,
			internalMessageAdapter,
			internalFileAdapter,
			internalSettingsAdapter,
			internalNotificationAdapter,
			federationQueueInstance,
			bridge,
		);
	}

	public static buildRoomServiceSender(
		internalRoomAdapter: RocketChatRoomAdapter,
		internalUserAdapter: RocketChatUserAdapter,
		internalFileAdapter: RocketChatFileAdapter,
		internalMessageAdapter: RocketChatMessageAdapter,
		internalSettingsAdapter: RocketChatSettingsAdapter,
		internalNotificationAdapter: RocketChatNotificationAdapter,
		internalQueueAdapter: RocketChatQueueAdapter,
		bridge: IFederationBridge,
	): FederationRoomServiceSender {
		return new FederationRoomServiceSender(
			internalRoomAdapter,
			internalUserAdapter,
			internalFileAdapter,
			internalMessageAdapter,
			internalSettingsAdapter,
			internalNotificationAdapter,
			internalQueueAdapter,
			bridge,
		);
	}

	public static buildUserServiceSender(
		internalRoomAdapter: RocketChatRoomAdapter,
		internalUserAdapter: RocketChatUserAdapter,
		internalFileAdapter: RocketChatFileAdapter,
		internalSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationUserServiceSender {
		return new FederationUserServiceSender(internalRoomAdapter, internalUserAdapter, internalFileAdapter, internalSettingsAdapter, bridge);
	}

	public static buildDirectMessageRoomServiceSender(
		internalRoomAdapter: RocketChatRoomAdapter,
		internalUserAdapter: RocketChatUserAdapter,
		internalFileAdapter: RocketChatFileAdapter,
		internalSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationDirectMessageRoomServiceSender {
		return new FederationDirectMessageRoomServiceSender(
			internalRoomAdapter,
			internalUserAdapter,
			internalFileAdapter,
			internalSettingsAdapter,
			bridge,
		);
	}

	public static buildMessageServiceSender(
		internalRoomAdapter: RocketChatRoomAdapter,
		internalUserAdapter: RocketChatUserAdapter,
		internalSettingsAdapter: RocketChatSettingsAdapter,
		internalMessageAdapter: RocketChatMessageAdapter,
		bridge: IFederationBridge,
	): FederationMessageServiceSender {
		return new FederationMessageServiceSender(
			internalRoomAdapter,
			internalUserAdapter,
			internalSettingsAdapter,
			internalMessageAdapter,
			bridge,
		);
	}

	public static buildMessageServiceReceiver(
		internalRoomAdapter: RocketChatRoomAdapter,
		internalUserAdapter: RocketChatUserAdapter,
		internalMessageAdapter: RocketChatMessageAdapter,
		internalFileAdapter: RocketChatFileAdapter,
		internalSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationMessageServiceReceiver {
		return new FederationMessageServiceReceiver(
			internalRoomAdapter,
			internalUserAdapter,
			internalMessageAdapter,
			internalFileAdapter,
			internalSettingsAdapter,
			bridge,
		);
	}

	public static buildUserServiceReceiver(
		internalRoomAdapter: RocketChatRoomAdapter,
		internalUserAdapter: RocketChatUserAdapter,
		internalFileAdapter: RocketChatFileAdapter,
		internalNotificationAdapter: RocketChatNotificationAdapter,
		internalSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationUserServiceReceiver {
		return new FederationUserServiceReceiver(
			internalRoomAdapter,
			internalUserAdapter,
			internalFileAdapter,
			internalNotificationAdapter,
			internalSettingsAdapter,
			bridge,
		);
	}

	public static buildUserService(
		internalSettingsAdapter: RocketChatSettingsAdapter,
		internalUserAdapter: RocketChatUserAdapter,
		internalFileAdapter: RocketChatFileAdapter,
		bridge: IFederationBridge,
	): FederationUserService {
		return new FederationUserService(internalSettingsAdapter, internalFileAdapter, internalUserAdapter, bridge);
	}

	public static buildRoomInternalValidator(
		internalRoomAdapter: RocketChatRoomAdapter,
		internalUserAdapter: RocketChatUserAdapter,
		internalFileAdapter: RocketChatFileAdapter,
		internalSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationRoomInternalValidator {
		return new FederationRoomInternalValidator(
			internalRoomAdapter,
			internalUserAdapter,
			internalFileAdapter,
			internalSettingsAdapter,
			bridge,
		);
	}

	public static buildFederationBridge(internalSettingsAdapter: RocketChatSettingsAdapter, queue: InMemoryQueue): IFederationBridge {
		return new MatrixBridge(internalSettingsAdapter, queue.addToQueue.bind(queue));
	}

	public static buildFederationEventHandler(
		roomServiceReceive: FederationRoomServiceReceiver,
		messageServiceReceiver: FederationMessageServiceReceiver,
		userServiceReceiver: FederationUserServiceReceiver,
		internalSettingsAdapter: RocketChatSettingsAdapter,
	): MatrixEventsHandler {
		return new MatrixEventsHandler(
			FederationFactory.getEventHandlers(roomServiceReceive, messageServiceReceiver, userServiceReceiver, internalSettingsAdapter),
		);
	}

	public static getEventHandlers(
		roomServiceReceiver: FederationRoomServiceReceiver,
		messageServiceReceiver: FederationMessageServiceReceiver,
		userServiceReceiver: FederationUserServiceReceiver,
		internalSettingsAdapter: RocketChatSettingsAdapter,
	): MatrixBaseEventHandler[] {
		return [
			new MatrixRoomCreatedHandler(roomServiceReceiver),
			new MatrixRoomMembershipChangedHandler(roomServiceReceiver, internalSettingsAdapter),
			new MatrixRoomMessageSentHandler(roomServiceReceiver),
			new MatrixRoomJoinRulesChangedHandler(roomServiceReceiver),
			new MatrixRoomNameChangedHandler(roomServiceReceiver),
			new MatrixRoomTopicChangedHandler(roomServiceReceiver),
			new MatrixRoomEventRedactedHandler(roomServiceReceiver),
			new MatrixMessageReactedHandler(messageServiceReceiver),
			new MatrixUserTypingStatusChangedHandler(userServiceReceiver),
			new MatrixRoomPowerLevelsChangedHandler(roomServiceReceiver),
		];
	}

	public static setupListenersForLocalActions(
		roomServiceSender: FederationRoomServiceSender,
		messageServiceSender: FederationMessageServiceSender,
	): void {
		FederationHooks.afterUserLeaveRoom((user: IUser, room: IRoom) =>
			roomServiceSender.afterUserLeaveRoom(FederationRoomSenderConverter.toAfterUserLeaveRoom(user._id, room._id)),
		);
		FederationHooks.onUserRemovedFromRoom((user: IUser, room: IRoom, userWhoRemoved: IUser) =>
			roomServiceSender.onUserRemovedFromRoom(
				FederationRoomSenderConverter.toOnUserRemovedFromRoom(user._id, room._id, userWhoRemoved._id),
			),
		);
		FederationHooks.afterMessageReacted((message: IMessage, user: IUser, reaction: string) =>
			messageServiceSender.sendExternalMessageReaction(message, user, reaction),
		);
		FederationHooks.afterMessageunReacted((message: IMessage, user: IUser, reaction: string) =>
			messageServiceSender.sendExternalMessageUnReaction(message, user, reaction),
		);
		FederationHooks.afterMessageDeleted((message: IMessage, roomId: string) => roomServiceSender.afterMessageDeleted(message, roomId));
		FederationHooks.afterMessageUpdated((message: IMessage, roomId: string, userId: string) =>
			roomServiceSender.afterMessageUpdated(message, roomId, userId),
		);
		FederationHooks.afterMessageSent((message: IMessage, roomId: string, userId: string) =>
			roomServiceSender.sendExternalMessage(FederationRoomSenderConverter.toSendExternalMessageDto(userId, roomId, message)),
		);
		FederationHooks.afterRoomNameChanged(async (roomId: string, roomName: string) =>
			roomServiceSender.afterRoomNameChanged(roomId, roomName),
		);
		FederationHooks.afterRoomTopicChanged(async (roomId: string, roomTopic: string) =>
			roomServiceSender.afterRoomTopicChanged(roomId, roomTopic),
		);
	}

	public static setupListenersForLocalActionsWhenValidLicense(
		roomServiceSender: FederationRoomServiceSender,
		dmRoomServiceSender: FederationDirectMessageRoomServiceSender,
		settingsAdapter: RocketChatSettingsAdapter,
	): void {
		const homeServerDomain = settingsAdapter.getHomeServerDomain();
		FederationHooks.onFederatedRoomCreated(async (room: IRoom, owner: IUser, originalMemberList: string[]) =>
			roomServiceSender.onRoomCreated(
				FederationRoomSenderConverter.toOnRoomCreationDto(owner._id, owner.username || '', room._id, originalMemberList, homeServerDomain),
			),
		);
		FederationHooks.onUsersAddedToARoom(async (room: IRoom, members: IUser[] | Username[], owner?: IUser) =>
			roomServiceSender.onUsersAddedToARoom(
				FederationRoomSenderConverter.toOnAddedUsersToARoomDto(
					owner?._id || '',
					owner?.username || '',
					room._id,
					members,
					homeServerDomain,
				),
			),
		);
		FederationHooks.beforeDirectMessageRoomCreate(async (members: IUser[] | string[]) =>
			dmRoomServiceSender.beforeDirectMessageRoomCreation(
				FederationRoomSenderConverter.toBeforeDirectMessageCreatedDto(members, homeServerDomain),
			),
		);
		FederationHooks.onDirectMessageRoomCreated(async (room: IRoom, ownerId: IUser['_id'], members: IUser[] | string[]) =>
			dmRoomServiceSender.onDirectMessageRoomCreation(
				FederationRoomSenderConverter.toOnDirectMessageCreatedDto(ownerId, room._id, members, homeServerDomain),
			),
		);
		FederationHooks.beforeAddUserToARoom(async (user: IUser | string, room: IRoom, inviter?: IUser) =>
			roomServiceSender.beforeAddUserToARoom(
				FederationRoomSenderConverter.toBeforeAddUserToARoomDto([user], room, homeServerDomain, inviter),
			),
		);
	}

	public static setupValidators(roomInternalHooksValidator: FederationRoomInternalValidator): void {
		FederationHooks.canAddFederatedUserToNonFederatedRoom((user: IUser | string, room: IRoom) =>
			roomInternalHooksValidator.canAddFederatedUserToNonFederatedRoom(user, room),
		);
		FederationHooks.canAddFederatedUserToFederatedRoom((user: IUser | string, inviter: IUser, room: IRoom) =>
			roomInternalHooksValidator.canAddFederatedUserToFederatedRoom(user, inviter, room),
		);
		FederationHooks.canCreateDirectMessageFromUI((members: (IUser | string)[]) =>
			roomInternalHooksValidator.canCreateDirectMessageFromUI(members),
		);
	}
}

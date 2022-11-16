import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import { FederationRoomServiceListener } from '../application/RoomServiceListener';
import { FederationRoomServiceSender } from '../application/sender/RoomServiceSender';
import { MatrixBridge } from './matrix/Bridge';
import { MatrixEventsHandler } from './matrix/handlers';
import type { MatrixBaseEventHandler } from './matrix/handlers/BaseEvent';
import {
	MatrixRoomCreatedHandler,
	MatrixRoomEventRedactedHandler,
	MatrixRoomJoinRulesChangedHandler,
	MatrixRoomMembershipChangedHandler,
	MatrixRoomMessageSentHandler,
	MatrixRoomNameChangedHandler,
	MatrixRoomTopicChangedHandler,
} from './matrix/handlers/Room';
import { InMemoryQueue } from './queue/InMemoryQueue';
import { RocketChatMessageAdapter } from './rocket-chat/adapters/Message';
import { RocketChatRoomAdapter } from './rocket-chat/adapters/Room';
import { RocketChatSettingsAdapter } from './rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from './rocket-chat/adapters/User';
import type { IFederationBridge } from '../domain/IFederationBridge';
import { FederationHooks } from './rocket-chat/hooks';
import { FederationRoomSenderConverter } from './rocket-chat/converters/RoomSender';
import { FederationRoomInternalHooksValidator } from '../application/sender/RoomInternalHooksValidator';
import { RocketChatFileAdapter } from './rocket-chat/adapters/File';
import { FederationMessageServiceListener } from '../application/MessageServiceListener';
import { MatrixMessageReactedHandler } from './matrix/handlers/Message';
import { FederationMessageServiceSender } from '../application/sender/MessageServiceSender';
import { FederationUserServiceListener } from '../application/UserServiceListener';
import { MatrixUserTypingStatusChangedHandler } from './matrix/handlers/User';
import { FederationUserServiceSender } from '../application/sender/UserServiceSender';
import { RocketChatNotificationAdapter } from './rocket-chat/adapters/Notification';

export class FederationFactory {
	public static buildRocketSettingsAdapter(): RocketChatSettingsAdapter {
		return new RocketChatSettingsAdapter();
	}

	public static buildRocketRoomAdapter(): RocketChatRoomAdapter {
		return new RocketChatRoomAdapter();
	}

	public static buildRocketUserAdapter(): RocketChatUserAdapter {
		return new RocketChatUserAdapter();
	}

	public static buildRocketMessageAdapter(): RocketChatMessageAdapter {
		return new RocketChatMessageAdapter();
	}

	public static buildRocketFileAdapter(): RocketChatFileAdapter {
		return new RocketChatFileAdapter();
	}

	public static buildRocketNotificationAdapter(): RocketChatNotificationAdapter {
		return new RocketChatNotificationAdapter();
	}

	public static buildFederationQueue(): InMemoryQueue {
		return new InMemoryQueue();
	}

	public static buildRoomServiceReceiver(
		rocketRoomAdapter: RocketChatRoomAdapter,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketMessageAdapter: RocketChatMessageAdapter,
		rocketFileAdapter: RocketChatFileAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		rocketNotificationAdapter: RocketChatNotificationAdapter,
		bridge: IFederationBridge,
	): FederationRoomServiceListener {
		return new FederationRoomServiceListener(
			rocketRoomAdapter,
			rocketUserAdapter,
			rocketMessageAdapter,
			rocketFileAdapter,
			rocketSettingsAdapter,
			rocketNotificationAdapter,
			bridge,
		);
	}

	public static buildRoomServiceSender(
		rocketRoomAdapter: RocketChatRoomAdapter,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketFileAdapter: RocketChatFileAdapter,
		rocketMessageAdapter: RocketChatMessageAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		rocketNotificationAdapter: RocketChatNotificationAdapter,
		bridge: IFederationBridge,
	): FederationRoomServiceSender {
		return new FederationRoomServiceSender(
			rocketRoomAdapter,
			rocketUserAdapter,
			rocketFileAdapter,
			rocketMessageAdapter,
			rocketSettingsAdapter,
			rocketNotificationAdapter,
			bridge,
		);
	}

	public static buildUserServiceSender(
		rocketRoomAdapter: RocketChatRoomAdapter,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketFileAdapter: RocketChatFileAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationUserServiceSender {
		return new FederationUserServiceSender(rocketRoomAdapter, rocketUserAdapter, rocketFileAdapter, rocketSettingsAdapter, bridge);
	}

	public static buildMessageServiceSender(
		rocketRoomAdapter: RocketChatRoomAdapter,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		rocketMessageAdapter: RocketChatMessageAdapter,
		bridge: IFederationBridge,
	): FederationMessageServiceSender {
		return new FederationMessageServiceSender(rocketRoomAdapter, rocketUserAdapter, rocketSettingsAdapter, rocketMessageAdapter, bridge);
	}

	public static buildMessageServiceReceiver(
		rocketRoomAdapter: RocketChatRoomAdapter,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketMessageAdapter: RocketChatMessageAdapter,
		rocketFileAdapter: RocketChatFileAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationMessageServiceListener {
		return new FederationMessageServiceListener(
			rocketRoomAdapter,
			rocketUserAdapter,
			rocketMessageAdapter,
			rocketFileAdapter,
			rocketSettingsAdapter,
			bridge,
		);
	}

	public static buildUserServiceReceiver(
		rocketRoomAdapter: RocketChatRoomAdapter,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketFileAdapter: RocketChatFileAdapter,
		rocketNotificationAdapter: RocketChatNotificationAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationUserServiceListener {
		return new FederationUserServiceListener(
			rocketRoomAdapter,
			rocketUserAdapter,
			rocketFileAdapter,
			rocketNotificationAdapter,
			rocketSettingsAdapter,
			bridge,
		);
	}

	public static buildRoomInternalHooksValidator(
		rocketRoomAdapter: RocketChatRoomAdapter,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketFileAdapter: RocketChatFileAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationRoomInternalHooksValidator {
		return new FederationRoomInternalHooksValidator(rocketRoomAdapter, rocketUserAdapter, rocketFileAdapter, rocketSettingsAdapter, bridge);
	}

	public static buildFederationBridge(rocketSettingsAdapter: RocketChatSettingsAdapter, queue: InMemoryQueue): IFederationBridge {
		return new MatrixBridge(
			rocketSettingsAdapter.getApplicationServiceId(),
			rocketSettingsAdapter.getHomeServerUrl(),
			rocketSettingsAdapter.getHomeServerDomain(),
			rocketSettingsAdapter.getBridgeUrl(),
			rocketSettingsAdapter.getBridgePort(),
			rocketSettingsAdapter.generateRegistrationFileObject(),
			queue.addToQueue.bind(queue),
		);
	}

	public static buildFederationEventHandler(
		roomServiceReceive: FederationRoomServiceListener,
		messageServiceReceiver: FederationMessageServiceListener,
		userServiceReceiver: FederationUserServiceListener,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
	): MatrixEventsHandler {
		return new MatrixEventsHandler(
			FederationFactory.getEventHandlers(roomServiceReceive, messageServiceReceiver, userServiceReceiver, rocketSettingsAdapter),
		);
	}

	public static getEventHandlers(
		roomServiceReceiver: FederationRoomServiceListener,
		messageServiceReceiver: FederationMessageServiceListener,
		userServiceReceiver: FederationUserServiceListener,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
	): MatrixBaseEventHandler[] {
		return [
			new MatrixRoomCreatedHandler(roomServiceReceiver),
			new MatrixRoomMembershipChangedHandler(roomServiceReceiver, rocketSettingsAdapter),
			new MatrixRoomMessageSentHandler(roomServiceReceiver, rocketSettingsAdapter),
			new MatrixRoomJoinRulesChangedHandler(roomServiceReceiver),
			new MatrixRoomNameChangedHandler(roomServiceReceiver),
			new MatrixRoomTopicChangedHandler(roomServiceReceiver),
			new MatrixRoomEventRedactedHandler(roomServiceReceiver),
			new MatrixMessageReactedHandler(messageServiceReceiver),
			new MatrixUserTypingStatusChangedHandler(userServiceReceiver),
		];
	}

	public static setupListeners(
		roomServiceSender: FederationRoomServiceSender,
		roomInternalHooksValidator: FederationRoomInternalHooksValidator,
		messageServiceSender: FederationMessageServiceSender,
	): void {
		FederationFactory.setupActions(roomServiceSender, messageServiceSender);
		FederationFactory.setupValidators(roomInternalHooksValidator);
	}

	public static setupActions(roomServiceSender: FederationRoomServiceSender, messageServiceSender: FederationMessageServiceSender): void {
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
	}

	public static setupValidators(roomInternalHooksValidator: FederationRoomInternalHooksValidator): void {
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

	public static removeCEListeners(): void {
		FederationHooks.removeCEValidation();
	}
}

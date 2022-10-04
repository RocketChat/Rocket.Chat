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

	public static buildFederationQueue(): InMemoryQueue {
		return new InMemoryQueue();
	}

	public static buildRoomServiceReceiver(
		rocketRoomAdapter: RocketChatRoomAdapter,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketMessageAdapter: RocketChatMessageAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		rocketFileAdapter: RocketChatFileAdapter,
		bridge: IFederationBridge,
	): FederationRoomServiceListener {
		return new FederationRoomServiceListener(
			rocketRoomAdapter,
			rocketUserAdapter,
			rocketMessageAdapter,
			rocketSettingsAdapter,
			rocketFileAdapter,
			bridge,
		);
	}

	public static buildRoomServiceSender(
		rocketRoomAdapter: RocketChatRoomAdapter,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		rocketFileAdapter: RocketChatFileAdapter,
		bridge: IFederationBridge,
	): FederationRoomServiceSender {
		return new FederationRoomServiceSender(rocketRoomAdapter, rocketUserAdapter, rocketSettingsAdapter, rocketFileAdapter, bridge);
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
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationMessageServiceListener {
		return new FederationMessageServiceListener(rocketRoomAdapter, rocketUserAdapter, rocketMessageAdapter, rocketSettingsAdapter, bridge);
	}

	public static buildRoomInternalHooksValidator(
		rocketRoomAdapter: RocketChatRoomAdapter,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationRoomInternalHooksValidator {
		return new FederationRoomInternalHooksValidator(rocketRoomAdapter, rocketUserAdapter, rocketSettingsAdapter, bridge);
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
		rocketSettingsAdapter: RocketChatSettingsAdapter,
	): MatrixEventsHandler {
		return new MatrixEventsHandler(FederationFactory.getEventHandlers(roomServiceReceive, messageServiceReceiver, rocketSettingsAdapter));
	}

	public static getEventHandlers(
		roomServiceReceiver: FederationRoomServiceListener,
		messageServiceReceiver: FederationMessageServiceListener,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
	): MatrixBaseEventHandler[] {
		return [
			new MatrixRoomCreatedHandler(roomServiceReceiver),
			new MatrixRoomMembershipChangedHandler(roomServiceReceiver, rocketSettingsAdapter),
			new MatrixRoomMessageSentHandler(roomServiceReceiver),
			new MatrixRoomJoinRulesChangedHandler(roomServiceReceiver),
			new MatrixRoomNameChangedHandler(roomServiceReceiver),
			new MatrixRoomTopicChangedHandler(roomServiceReceiver),
			new MatrixRoomEventRedactedHandler(roomServiceReceiver),
			new MatrixMessageReactedHandler(messageServiceReceiver),
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

	private static setupActions(roomServiceSender: FederationRoomServiceSender, messageServiceSender: FederationMessageServiceSender): void {
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
	}

	private static setupValidators(roomInternalHooksValidator: FederationRoomInternalHooksValidator): void {
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

	public static removeListeners(): void {
		FederationHooks.removeCEValidation();
	}
}

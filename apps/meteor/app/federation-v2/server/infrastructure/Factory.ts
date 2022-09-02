import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { FederationRoomServiceListener } from '../application/RoomServiceListener';
import { FederationRoomServiceSender } from '../application/sender/RoomServiceSender';
import { MatrixBridge } from './matrix/Bridge';
import { MatrixEventsHandler } from './matrix/handlers';
import type { MatrixBaseEventHandler } from './matrix/handlers/BaseEvent';
import {
	MatrixRoomCreatedHandler,
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

	public static buildFederationQueue(): InMemoryQueue {
		return new InMemoryQueue();
	}

	public static buildRoomServiceReceiver(
		rocketRoomAdapter: RocketChatRoomAdapter,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketMessageAdapter: RocketChatMessageAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationRoomServiceListener {
		return new FederationRoomServiceListener(rocketRoomAdapter, rocketUserAdapter, rocketMessageAdapter, rocketSettingsAdapter, bridge);
	}

	public static buildRoomServiceSender(
		rocketRoomAdapter: RocketChatRoomAdapter,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationRoomServiceSender {
		return new FederationRoomServiceSender(rocketRoomAdapter, rocketUserAdapter, rocketSettingsAdapter, bridge);
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
		rocketSettingsAdapter: RocketChatSettingsAdapter,
	): MatrixEventsHandler {
		return new MatrixEventsHandler(FederationFactory.getEventHandlers(roomServiceReceive, rocketSettingsAdapter));
	}

	public static getEventHandlers(
		roomServiceReceiver: FederationRoomServiceListener,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
	): MatrixBaseEventHandler[] {
		return [
			new MatrixRoomCreatedHandler(roomServiceReceiver),
			new MatrixRoomMembershipChangedHandler(roomServiceReceiver, rocketSettingsAdapter),
			new MatrixRoomMessageSentHandler(roomServiceReceiver),
			new MatrixRoomJoinRulesChangedHandler(roomServiceReceiver),
			new MatrixRoomNameChangedHandler(roomServiceReceiver),
			new MatrixRoomTopicChangedHandler(roomServiceReceiver),
		];
	}

	public static setupListeners(
		roomServiceSender: FederationRoomServiceSender,
		roomInternalHooksValidator: FederationRoomInternalHooksValidator,
	): void {
		FederationFactory.setupActions(roomServiceSender);
		FederationFactory.setupValidators(roomInternalHooksValidator);
	}

	private static setupActions(roomServiceSender: FederationRoomServiceSender): void {
		FederationHooks.afterUserLeaveRoom((user: IUser, room: IRoom) =>
			roomServiceSender.afterUserLeaveRoom(FederationRoomSenderConverter.toAfterUserLeaveRoom(user._id, room._id)),
		);
		FederationHooks.onUserRemovedFromRoom((user: IUser, room: IRoom, userWhoRemoved: IUser) =>
			roomServiceSender.onUserRemovedFromRoom(
				FederationRoomSenderConverter.toOnUserRemovedFromRoom(user._id, room._id, userWhoRemoved._id),
			),
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

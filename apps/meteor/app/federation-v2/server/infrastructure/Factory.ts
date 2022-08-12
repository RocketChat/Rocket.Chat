import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { FederationRoomServiceReceiver } from '../application/RoomServiceReceiver';
import { FederationRoomServiceSender } from '../application/RoomServiceSender';
import { MatrixBridge } from './matrix/Bridge';
import { MatrixEventsHandler } from './matrix/handlers';
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

	public static buildQueue(): InMemoryQueue {
		return new InMemoryQueue();
	}

	public static buildRoomServiceReceiver(
		rocketRoomAdapter: RocketChatRoomAdapter,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketMessageAdapter: RocketChatMessageAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationRoomServiceReceiver {
		return new FederationRoomServiceReceiver(rocketRoomAdapter, rocketUserAdapter, rocketMessageAdapter, rocketSettingsAdapter, bridge);
	}

	public static buildRoomServiceSender(
		rocketRoomAdapter: RocketChatRoomAdapter,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridge,
	): FederationRoomServiceSender {
		return new FederationRoomServiceSender(rocketRoomAdapter, rocketUserAdapter, rocketSettingsAdapter, bridge);
	}

	public static buildBridge(rocketSettingsAdapter: RocketChatSettingsAdapter, queue: InMemoryQueue): IFederationBridge {
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

	public static buildEventHandlers(
		roomServiceReceive: FederationRoomServiceReceiver,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
	): MatrixEventsHandler {
		return new MatrixEventsHandler(FederationFactory.getEventHandlers(roomServiceReceive, rocketSettingsAdapter));
	}

	public static getEventHandlers(
		roomServiceReceiver: FederationRoomServiceReceiver,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
	): any[] {
		return [
			new MatrixRoomCreatedHandler(roomServiceReceiver),
			new MatrixRoomMembershipChangedHandler(roomServiceReceiver, rocketSettingsAdapter),
			new MatrixRoomMessageSentHandler(roomServiceReceiver),
			new MatrixRoomJoinRulesChangedHandler(roomServiceReceiver),
			new MatrixRoomNameChangedHandler(roomServiceReceiver),
			new MatrixRoomTopicChangedHandler(roomServiceReceiver),
		];
	}

	public static setupListeners(roomServiceSender: FederationRoomServiceSender): void {
		FederationHooks.afterLeaveRoom(async (user: IUser, room: IRoom) =>
			roomServiceSender.leaveRoom(FederationRoomSenderConverter.toAfterLeaveRoom(user._id, room._id)),
		);
		FederationHooks.afterRemoveFromRoom(async (user: IUser, room: IRoom, userWhoRemoved: IUser) =>
			roomServiceSender.leaveRoom(FederationRoomSenderConverter.toAfterLeaveRoom(user._id, room._id, userWhoRemoved._id)),
		);
		FederationHooks.canAddTheUserToTheRoom((user: IUser | string, room: IRoom) => roomServiceSender.canAddThisUserToTheRoom(user, room));
		FederationHooks.canAddUsersToTheRoom((user: IUser | string, inviter: IUser, room: IRoom) =>
			roomServiceSender.canAddUsersToTheRoom(user, inviter, room),
		);
		FederationHooks.beforeCreateDirectMessage((members: (IUser | string)[]) => roomServiceSender.beforeCreateDirectMessageFromUI(members));
	}

	public static removeListeners(): void {
		FederationHooks.removeCEValidation();
	}
}

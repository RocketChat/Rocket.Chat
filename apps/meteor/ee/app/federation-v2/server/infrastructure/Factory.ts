import { IRoom, IUser } from '@rocket.chat/core-typings';

import { FederationFactory } from '../../../../../app/federation-v2/server/infrastructure/Factory';
import { MatrixRoomMessageSentHandler } from '../../../../../app/federation-v2/server/infrastructure/matrix/handlers/Room';
import { InMemoryQueue } from '../../../../../app/federation-v2/server/infrastructure/queue/InMemoryQueue';
import { RocketChatMessageAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Message';
import { RocketChatSettingsAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/User';
import { FederationRoomServiceReceiverEE } from '../application/RoomServiceReceiver';
import { FederationRoomServiceSenderEE } from '../application/RoomServiceSender';
import { IFederationBridgeEE } from '../domain/IFederationBridge';
import { MatrixBridgeEE } from './matrix/Bridge';
import { MatrixEventsHandlerEE } from './matrix/handlers';
import { MatrixRoomJoinRulesChangedHandler, MatrixRoomNameChangedHandler, MatrixRoomTopicChangedHandler } from './matrix/handlers/Room';
import { RocketChatNotificationAdapter } from './rocket-chat/adapters/Notification';
import { RocketChatRoomAdapterEE } from './rocket-chat/adapters/Room';
import { RocketChatUserAdapterEE } from './rocket-chat/adapters/User';
import { FederationRoomSenderConverterEE } from './rocket-chat/converters/RoomSender';
import { FederationHooksEE } from './rocket-chat/hooks';

export class FederationFactoryEE {
	public static buildRoomServiceReceiver(
		rocketRoomAdapter: RocketChatRoomAdapterEE,
		rocketUserAdapter: RocketChatUserAdapter,
		rocketMessageAdapter: RocketChatMessageAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridgeEE,
	): FederationRoomServiceReceiverEE {
		return new FederationRoomServiceReceiverEE(rocketRoomAdapter, rocketUserAdapter, rocketMessageAdapter, rocketSettingsAdapter, bridge);
	}

	public static buildRoomServiceSender(
		rocketRoomAdapter: RocketChatRoomAdapterEE,
		rocketUserAdapter: RocketChatUserAdapterEE,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		rocketNotificationAdapter: RocketChatNotificationAdapter,
		bridge: IFederationBridgeEE,
	): FederationRoomServiceSenderEE {
		return new FederationRoomServiceSenderEE(
			rocketRoomAdapter,
			rocketUserAdapter,
			rocketSettingsAdapter,
			rocketNotificationAdapter,
			bridge,
		);
	}

	public static buildBridge(rocketSettingsAdapter: RocketChatSettingsAdapter, queue: InMemoryQueue): IFederationBridgeEE {
		return new MatrixBridgeEE(
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
		roomServiceReceive: FederationRoomServiceReceiverEE,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
	): MatrixEventsHandlerEE {
		const EVENT_HANDLERS = [
			...FederationFactory.getEventHandlers(roomServiceReceive, rocketSettingsAdapter),
			new MatrixRoomJoinRulesChangedHandler(roomServiceReceive),
			new MatrixRoomNameChangedHandler(roomServiceReceive),
			new MatrixRoomTopicChangedHandler(roomServiceReceive),
			new MatrixRoomMessageSentHandler(roomServiceReceive),
		];

		return new MatrixEventsHandlerEE(EVENT_HANDLERS);
	}

	public static buildRocketRoomAdapter(): RocketChatRoomAdapterEE {
		return new RocketChatRoomAdapterEE();
	}

	public static buildRocketNotificationdapter(): RocketChatNotificationAdapter {
		return new RocketChatNotificationAdapter();
	}

	public static buildRocketUserAdapter(): RocketChatUserAdapterEE {
		return new RocketChatUserAdapterEE();
	}

	public static setupListeners(roomServiceSender: FederationRoomServiceSenderEE, settingsAdapter: RocketChatSettingsAdapter): void {
		const homeServerDomain = settingsAdapter.getHomeServerDomain();
		FederationHooksEE.onFederatedRoomCreated(async (room: IRoom, owner: IUser, originalMemberList: string[]) =>
			roomServiceSender.onRoomCreated(
				FederationRoomSenderConverterEE.toOnRoomCreationDto(
					owner._id,
					owner.username as string,
					room._id,
					originalMemberList,
					homeServerDomain,
				),
			),
		);
		FederationHooksEE.onUsersAddedToARoom(async (room: IRoom, owner: IUser, members: IUser[] | string[]) =>
			roomServiceSender.onUsersAddedToARoom(
				FederationRoomSenderConverterEE.toOnAddedUsersToARoomDto(owner._id, owner.username as string, room._id, members, homeServerDomain),
			),
		);
		FederationHooksEE.beforeDirectMessageRoomCreate(async (members: IUser[] | string[]) =>
			roomServiceSender.beforeDirectMessageRoomCreation(
				FederationRoomSenderConverterEE.toBeforeDirectMessageCreatedDto(members, homeServerDomain),
			),
		);
		FederationHooksEE.onDirectMessageRoomCreated(async (room: IRoom, ownerId: IUser['_id'], members: IUser[] | string[]) =>
			roomServiceSender.onDirectMessageRoomCreation(
				FederationRoomSenderConverterEE.toOnDirectMessageCreatedDto(ownerId, room._id, members, homeServerDomain),
			),
		);
		FederationHooksEE.beforeAddUserToARoom(async (user: IUser | string, room: IRoom) =>
			roomServiceSender.beforeAddUserToARoom(FederationRoomSenderConverterEE.toBeforeAddUserToARoomDto([user], room, homeServerDomain)),
		);
	}

	public static removeListeners(): void {
		FederationHooksEE.removeAll();
	}
}

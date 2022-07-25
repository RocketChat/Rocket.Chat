import { IRoom, IUser } from '@rocket.chat/core-typings';

import { InMemoryQueue } from '../../../../../app/federation-v2/server/infrastructure/queue/InMemoryQueue';
import { RocketChatSettingsAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { FederationRoomServiceSenderEE } from '../application/RoomServiceSender';
import { IFederationBridgeEE } from '../domain/IFederationBridge';
import { MatrixBridgeEE } from './matrix/Bridge';
import { RocketChatNotificationAdapter } from './rocket-chat/adapters/Notification';
import { RocketChatRoomAdapterEE } from './rocket-chat/adapters/Room';
import { RocketChatUserAdapterEE } from './rocket-chat/adapters/User';
import { FederationRoomSenderConverterEE } from './rocket-chat/converters/RoomSender';
import { FederationHooksEE } from './rocket-chat/hooks';

export class FederationFactoryEE {
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
		FederationHooksEE.afterRoomNameChanged(async (roomId: string, roomName: string) =>
			roomServiceSender.afterRoomNameChanged(roomId, roomName),
		);
		FederationHooksEE.afterRoomTopicChanged(async (roomId: string, roomTopic: string) =>
			roomServiceSender.afterRoomTopicChanged(roomId, roomTopic),
		);
	}

	public static removeListeners(): void {
		FederationHooksEE.removeAll();
	}
}

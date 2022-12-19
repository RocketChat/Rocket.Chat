import type { IRoom, IUser } from '@rocket.chat/core-typings';

import type { InMemoryQueue } from '../../../../../app/federation-v2/server/infrastructure/queue/InMemoryQueue';
import type { RocketChatSettingsAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Settings';
import { FederationDMRoomInternalHooksServiceSender } from '../application/sender/room/DMRoomInternalHooksServiceSender';
import { FederationRoomInternalHooksServiceSender } from '../application/sender/room/RoomInternalHooksServiceSender';
import { FederationRoomServiceSenderEE } from '../application/sender/room/RoomServiceSender';
import type { IFederationBridgeEE } from '../domain/IFederationBridge';
import { MatrixBridgeEE } from './matrix/Bridge';
import { RocketChatRoomAdapterEE } from './rocket-chat/adapters/Room';
import { RocketChatUserAdapterEE } from './rocket-chat/adapters/User';
import { FederationRoomSenderConverterEE } from './rocket-chat/converters/RoomSender';
import { FederationHooksEE } from './rocket-chat/hooks';
import type { RocketChatMessageAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Message';
import type { RocketChatFileAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/File';
import { RocketChatNotificationAdapter } from '../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Notification';

export class FederationFactoryEE {
	public static buildRoomServiceSender(
		rocketRoomAdapter: RocketChatRoomAdapterEE,
		rocketUserAdapter: RocketChatUserAdapterEE,
		rocketFileAdapter: RocketChatFileAdapter,
		rocketMessageAdapter: RocketChatMessageAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		rocketNotificationAdapter: RocketChatNotificationAdapter,
		bridge: IFederationBridgeEE,
	): FederationRoomServiceSenderEE {
		return new FederationRoomServiceSenderEE(
			rocketRoomAdapter,
			rocketUserAdapter,
			rocketFileAdapter,
			rocketMessageAdapter,
			rocketSettingsAdapter,
			rocketNotificationAdapter,
			bridge,
		);
	}

	public static buildRoomInternalHooksServiceSender(
		rocketRoomAdapter: RocketChatRoomAdapterEE,
		rocketUserAdapter: RocketChatUserAdapterEE,
		rocketFileAdapter: RocketChatFileAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		rocketMessageAdapter: RocketChatMessageAdapter,
		bridge: IFederationBridgeEE,
	): FederationRoomInternalHooksServiceSender {
		return new FederationRoomInternalHooksServiceSender(
			rocketRoomAdapter,
			rocketUserAdapter,
			rocketFileAdapter,
			rocketSettingsAdapter,
			rocketMessageAdapter,
			bridge,
		);
	}

	public static buildDMRoomInternalHooksServiceSender(
		rocketRoomAdapter: RocketChatRoomAdapterEE,
		rocketUserAdapter: RocketChatUserAdapterEE,
		rocketFileAdapter: RocketChatFileAdapter,
		rocketSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridgeEE,
	): FederationDMRoomInternalHooksServiceSender {
		return new FederationDMRoomInternalHooksServiceSender(
			rocketRoomAdapter,
			rocketUserAdapter,
			rocketFileAdapter,
			rocketSettingsAdapter,
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

	public static setupListeners(
		roomInternalHooksServiceSender: FederationRoomInternalHooksServiceSender,
		dmRoomInternalHooksServiceSender: FederationDMRoomInternalHooksServiceSender,
		settingsAdapter: RocketChatSettingsAdapter,
	): void {
		const homeServerDomain = settingsAdapter.getHomeServerDomain();
		FederationHooksEE.onFederatedRoomCreated(async (room: IRoom, owner: IUser, originalMemberList: string[]) =>
			roomInternalHooksServiceSender.onRoomCreated(
				FederationRoomSenderConverterEE.toOnRoomCreationDto(
					owner._id,
					owner.username || '',
					room._id,
					originalMemberList,
					homeServerDomain,
				),
			),
		);
		FederationHooksEE.onUsersAddedToARoom(async (room: IRoom, owner: IUser, members: IUser[] | string[]) =>
			roomInternalHooksServiceSender.onUsersAddedToARoom(
				FederationRoomSenderConverterEE.toOnAddedUsersToARoomDto(owner._id, owner.username || '', room._id, members, homeServerDomain),
			),
		);
		FederationHooksEE.beforeDirectMessageRoomCreate(async (members: IUser[] | string[]) =>
			dmRoomInternalHooksServiceSender.beforeDirectMessageRoomCreation(
				FederationRoomSenderConverterEE.toBeforeDirectMessageCreatedDto(members, homeServerDomain),
			),
		);
		FederationHooksEE.onDirectMessageRoomCreated(async (room: IRoom, ownerId: IUser['_id'], members: IUser[] | string[]) =>
			dmRoomInternalHooksServiceSender.onDirectMessageRoomCreation(
				FederationRoomSenderConverterEE.toOnDirectMessageCreatedDto(ownerId, room._id, members, homeServerDomain),
			),
		);
		FederationHooksEE.beforeAddUserToARoom(async (user: IUser | string, room: IRoom) =>
			roomInternalHooksServiceSender.beforeAddUserToARoom(
				FederationRoomSenderConverterEE.toBeforeAddUserToARoomDto([user], room, homeServerDomain),
			),
		);
		FederationHooksEE.afterRoomNameChanged(async (roomId: string, roomName: string) =>
			roomInternalHooksServiceSender.afterRoomNameChanged(roomId, roomName),
		);
		FederationHooksEE.afterRoomTopicChanged(async (roomId: string, roomTopic: string) =>
			roomInternalHooksServiceSender.afterRoomTopicChanged(roomId, roomTopic),
		);
	}

	public static removeListeners(): void {
		FederationHooksEE.removeAll();
	}
}

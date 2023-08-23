import type { IRoom, IUser, Username } from '@rocket.chat/core-typings';

import { FederationFactory } from '../../../../../server/services/federation/infrastructure/Factory';
import type { InMemoryQueue } from '../../../../../server/services/federation/infrastructure/queue/InMemoryQueue';
import type { RocketChatFileAdapter } from '../../../../../server/services/federation/infrastructure/rocket-chat/adapters/File';
import type { RocketChatMessageAdapter } from '../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Message';
import { RocketChatNotificationAdapter } from '../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Notification';
import type { RocketChatSettingsAdapter } from '../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Settings';
import { FederationUserServiceEE } from '../application/UserService';
import { FederationDirectMessageRoomServiceSender } from '../application/room/sender/DirectMessageRoomServiceSender';
import { FederationRoomServiceSender } from '../application/room/sender/RoomServiceSender';
import type { IFederationBridgeEE } from '../domain/IFederationBridge';
import { MatrixBridgeEE } from './matrix/Bridge';
import { RocketChatQueueAdapterEE } from './rocket-chat/adapters/Queue';
import { RocketChatRoomAdapterEE } from './rocket-chat/adapters/Room';
import { RocketChatUserAdapterEE } from './rocket-chat/adapters/User';
import { FederationRoomSenderConverterEE } from './rocket-chat/converters/RoomSender';
import { FederationHooksEE } from './rocket-chat/hooks';

export class FederationFactoryEE extends FederationFactory {
	public static buildFederationBridge(internalSettingsAdapter: RocketChatSettingsAdapter, queue: InMemoryQueue): IFederationBridgeEE {
		return new MatrixBridgeEE(internalSettingsAdapter, queue.addToQueue.bind(queue));
	}

	public static buildInternalRoomAdapter(): RocketChatRoomAdapterEE {
		return new RocketChatRoomAdapterEE();
	}

	public static buildInternalNotificationAdapter(): RocketChatNotificationAdapter {
		return new RocketChatNotificationAdapter();
	}

	public static buildInternalUserAdapter(): RocketChatUserAdapterEE {
		return new RocketChatUserAdapterEE();
	}

	public static buildInternalQueueAdapter(): RocketChatQueueAdapterEE {
		return new RocketChatQueueAdapterEE();
	}

	public static buildRoomServiceSenderEE(
		internalRoomAdapter: RocketChatRoomAdapterEE,
		internalUserAdapter: RocketChatUserAdapterEE,
		internalFileAdapter: RocketChatFileAdapter,
		internalSettingsAdapter: RocketChatSettingsAdapter,
		internalMessageAdapter: RocketChatMessageAdapter,
		internalNotificationAdapter: RocketChatNotificationAdapter,
		internalQueueAdapter: RocketChatQueueAdapterEE,
		bridge: IFederationBridgeEE,
	): FederationRoomServiceSender {
		return new FederationRoomServiceSender(
			internalRoomAdapter,
			internalUserAdapter,
			internalFileAdapter,
			internalSettingsAdapter,
			internalMessageAdapter,
			internalNotificationAdapter,
			internalQueueAdapter,
			bridge,
		);
	}

	public static buildDirectMessageRoomServiceSender(
		internalRoomAdapter: RocketChatRoomAdapterEE,
		internalUserAdapter: RocketChatUserAdapterEE,
		internalFileAdapter: RocketChatFileAdapter,
		internalSettingsAdapter: RocketChatSettingsAdapter,
		bridge: IFederationBridgeEE,
	): FederationDirectMessageRoomServiceSender {
		return new FederationDirectMessageRoomServiceSender(
			internalRoomAdapter,
			internalUserAdapter,
			internalFileAdapter,
			internalSettingsAdapter,
			bridge,
		);
	}

	public static buildRoomApplicationService(
		internalSettingsAdapter: RocketChatSettingsAdapter,
		internalUserAdapter: RocketChatUserAdapterEE,
		internalFileAdapter: RocketChatFileAdapter,
		bridge: IFederationBridgeEE,
	): FederationUserServiceEE {
		return new FederationUserServiceEE(internalSettingsAdapter, internalFileAdapter, internalUserAdapter, bridge);
	}

	public static setupListenersForLocalActionsEE(
		roomInternalHooksServiceSender: FederationRoomServiceSender,
		dmRoomInternalHooksServiceSender: FederationDirectMessageRoomServiceSender,
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
		FederationHooksEE.onUsersAddedToARoom(async (room: IRoom, members: IUser[] | Username[], owner?: IUser) =>
			roomInternalHooksServiceSender.onUsersAddedToARoom(
				FederationRoomSenderConverterEE.toOnAddedUsersToARoomDto(
					owner?._id || '',
					owner?.username || '',
					room._id,
					members,
					homeServerDomain,
				),
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
		FederationHooksEE.beforeAddUserToARoom(async (user: IUser | string, room: IRoom, inviter?: IUser) =>
			roomInternalHooksServiceSender.beforeAddUserToARoom(
				FederationRoomSenderConverterEE.toBeforeAddUserToARoomDto([user], room, homeServerDomain, inviter),
			),
		);
	}

	public static removeAllListeners(): void {
		super.removeAllListeners();
		FederationHooksEE.removeAllListeners();
	}
}

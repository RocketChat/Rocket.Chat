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
import type { IFileAdapterDependencies } from './rocket-chat/adapters/File';
import { RocketChatFileAdapter } from './rocket-chat/adapters/File';
import { RocketChatMessageAdapter } from './rocket-chat/adapters/Message';
import { RocketChatNotificationAdapter } from './rocket-chat/adapters/Notification';
import { RocketChatQueueAdapter } from './rocket-chat/adapters/Queue';
import { RocketChatRoomAdapter } from './rocket-chat/adapters/Room';
import { RocketChatSettingsAdapter } from './rocket-chat/adapters/Settings';
import type { IUserAdapterDependencies } from './rocket-chat/adapters/User';
import { RocketChatUserAdapter } from './rocket-chat/adapters/User';

export class FederationFactory {
	public static buildInternalSettingsAdapter(): RocketChatSettingsAdapter {
		return new RocketChatSettingsAdapter();
	}

	public static buildInternalRoomAdapter(): RocketChatRoomAdapter {
		return new RocketChatRoomAdapter();
	}

	public static buildInternalUserAdapter(userAdapterDeps: IUserAdapterDependencies): RocketChatUserAdapter {
		return new RocketChatUserAdapter(userAdapterDeps);
	}

	public static buildInternalMessageAdapter(): RocketChatMessageAdapter {
		return new RocketChatMessageAdapter();
	}

	public static buildInternalFileAdapter(fileAdapterDeps: IFileAdapterDependencies): RocketChatFileAdapter {
		return new RocketChatFileAdapter(fileAdapterDeps);
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
}

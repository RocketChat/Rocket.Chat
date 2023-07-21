import { FederationRoomServiceReceiver } from '../application/room/receiver/RoomServiceReceiver';
import { FederationRoomServiceSender } from '../application/room/sender/RoomServiceSender';
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
	MatrixRoomPowerLevelsChangedHandler,
	MatrixRoomTopicChangedHandler,
} from './matrix/handlers/Room';
import { InMemoryQueue } from './queue/InMemoryQueue';
import { RocketChatMessageAdapter } from './rocket-chat/adapters/Message';
import { RocketChatRoomAdapter } from './rocket-chat/adapters/Room';
import { RocketChatSettingsAdapter } from './rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from './rocket-chat/adapters/User';
import type { IFederationBridge } from '../domain/IFederationBridge';
import { FederationRoomInternalValidator } from '../application/room/sender/RoomInternalValidator';
import { RocketChatFileAdapter } from './rocket-chat/adapters/File';
import { FederationMessageServiceReceiver } from '../application/room/message/receiver/MessageServiceReceiver';
import { MatrixMessageReactedHandler } from './matrix/handlers/Message';
import { FederationMessageServiceSender } from '../application/room/message/sender/MessageServiceSender';
import { FederationUserServiceReceiver } from '../application/user/receiver/UserServiceReceiver';
import { MatrixUserTypingStatusChangedHandler } from './matrix/handlers/User';
import { FederationUserServiceSender } from '../application/user/sender/UserServiceSender';
import { RocketChatNotificationAdapter } from './rocket-chat/adapters/Notification';
import { RocketChatQueueAdapter } from './rocket-chat/adapters/Queue';
import { FederationDirectMessageRoomServiceSender } from '../application/room/sender/DirectMessageRoomServiceSender';
import { FederationUserService } from '../application/user/UserService';

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
}

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
import { IFederationBridge } from '../domain/IFederationBridge';
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

	public static buildRocketNotificationdapter(): RocketChatNotificationAdapter {
		return new RocketChatNotificationAdapter();
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
		rocketNotificationAdapter: RocketChatNotificationAdapter,
		bridge: IFederationBridge,
	): FederationRoomServiceSender {
		return new FederationRoomServiceSender(rocketRoomAdapter, rocketUserAdapter, rocketSettingsAdapter, rocketNotificationAdapter, bridge);
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

	public static buildEventHandlers(roomServiceReceive: FederationRoomServiceReceiver): MatrixEventsHandler {
		const EVENT_HANDLERS = [
			new MatrixRoomCreatedHandler(roomServiceReceive),
			new MatrixRoomMembershipChangedHandler(roomServiceReceive),
			new MatrixRoomJoinRulesChangedHandler(roomServiceReceive),
			new MatrixRoomNameChangedHandler(roomServiceReceive),
			new MatrixRoomTopicChangedHandler(roomServiceReceive),
			new MatrixRoomMessageSentHandler(roomServiceReceive),
		];

		return new MatrixEventsHandler(EVENT_HANDLERS);
	}
}

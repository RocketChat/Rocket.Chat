import { type IFederationMatrixService, ServiceClass, Message } from '@rocket.chat/core-services';
import { Users, Rooms, MatrixBridgedUser, MatrixBridgedRoom } from '@rocket.chat/models';
import type { HomeserverEventHandler } from './events/HomeserverEventHandler';

export class FederationMatrix extends ServiceClass implements IFederationMatrixService {
	protected name = 'federation-matrix';
	private homeserverEventHandler: HomeserverEventHandler | null = null;

	constructor() {
		super();
	}

	setHomeserverEventHandler(handler: HomeserverEventHandler): void {
		this.homeserverEventHandler = handler;
		this.setupMatrixEventListeners();
	}

	private setupMatrixEventListeners(): void {
		if (!this.homeserverEventHandler) {
			return;
		}

		const emitter = this.homeserverEventHandler.getEmitter();

		// Listen for Matrix message events
		emitter.on('homeserver.matrix.message', async (data) => {
			console.log('[FederationMatrix] Processing Matrix message:', data.event_id);
			
			try {
				// Find the internal user by Matrix ID
				const localUserId = await MatrixBridgedUser.getLocalUserIdByExternalId(data.sender);
				if (!localUserId) {
					console.error('[FederationMatrix] No bridged user found for:', data.sender);
					return;
				}

				const user = await Users.findOneById(localUserId);
				if (!user) {
					console.error('[FederationMatrix] No internal user found for ID:', localUserId);
					return;
				}

				// Find the internal room by Matrix room ID
				const localRoomId = await MatrixBridgedRoom.getLocalRoomId(data.room_id);
				if (!localRoomId) {
					console.error('[FederationMatrix] No bridged room found for:', data.room_id);
					return;
				}

				const room = await Rooms.findOneById(localRoomId);
				if (!room) {
					console.error('[FederationMatrix] No internal room found for ID:', localRoomId);
					return;
				}

				// Send the message using Rocket.Chat's Message service
				const result = await Message.sendMessage({
					fromId: user._id,
					rid: room._id,
					msg: data.content.body
				});

				console.log('[FederationMatrix] Message sent successfully:', result._id);
			} catch (error) {
				console.error('[FederationMatrix] Error processing Matrix message:', error);
			}
		});
	}

    async created(): Promise<void> {
        console.log('Federation service created');
    }

	async started(): Promise<void> {
        console.log('Federation service started');
    }

    ping(): void {
        console.log('Federation service ping');
    }
}
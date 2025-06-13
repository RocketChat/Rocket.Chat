import type { HomeserverEvent, HomeserverRoom } from '@rocket.chat/core-services';
import { BaseEventHandler } from './BaseEventHandler';

export interface IRoomServiceReceiver {
	onExternalRoomCreated(room: HomeserverRoom): Promise<void>;
	onExternalUserJoinedRoom(roomId: string, userId: string): Promise<void>;
	onExternalUserLeftRoom(roomId: string, userId: string): Promise<void>;
}

export class RoomHandler extends BaseEventHandler {
	constructor(
		private roomReceiver: IRoomServiceReceiver,
	) {
		super('HomeserverRoomHandler');
	}

	public canHandle(event: HomeserverEvent): boolean {
		return event.type === 'room.create' || 
			   event.type === 'room.member.join' || 
			   event.type === 'room.member.leave';
	}

	public async handle(event: HomeserverEvent): Promise<void> {
		this.debug('Handling room event:', event.type, event.id);

		try {
			switch (event.type) {
				case 'room.create':
					await this.handleRoomCreate(event);
					break;
				case 'room.member.join':
					await this.handleMemberJoin(event);
					break;
				case 'room.member.leave':
					await this.handleMemberLeave(event);
					break;
				default:
					this.error('Unknown room event type:', event.type);
			}
		} catch (error) {
			this.error(`Failed to handle room event ${event.type}:`, error);
			throw error;
		}
	}

	private async handleRoomCreate(event: HomeserverEvent): Promise<void> {
		const room = event.data as HomeserverRoom;
		
		if (!room) {
			throw new Error('Invalid room data in event');
		}

		this.log('Processing room creation from homeserver:', room.id, room.name);
		await this.roomReceiver.onExternalRoomCreated(room);
	}

	private async handleMemberJoin(event: HomeserverEvent): Promise<void> {
		const { roomId, userId } = event.data as { roomId: string; userId: string };
		
		if (!roomId || !userId) {
			throw new Error('Invalid member join data in event');
		}

		this.log('Processing member join from homeserver:', userId, 'joined', roomId);
		await this.roomReceiver.onExternalUserJoinedRoom(roomId, userId);
	}

	private async handleMemberLeave(event: HomeserverEvent): Promise<void> {
		const { roomId, userId } = event.data as { roomId: string; userId: string };
		
		if (!roomId || !userId) {
			throw new Error('Invalid member leave data in event');
		}

		this.log('Processing member leave from homeserver:', userId, 'left', roomId);
		await this.roomReceiver.onExternalUserLeftRoom(roomId, userId);
	}
}
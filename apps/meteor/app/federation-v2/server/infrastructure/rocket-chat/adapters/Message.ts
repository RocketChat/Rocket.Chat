import { sendMessage } from '../../../../../lib/server';
import type { FederatedRoom } from '../../../domain/FederatedRoom';
import type { FederatedUser } from '../../../domain/FederatedUser';

export class RocketChatMessageAdapter {
	public async sendMessage(user: FederatedUser, room: FederatedRoom, messageText: string): Promise<void> {
		sendMessage(user.getInternalReference(), { msg: messageText }, room.getInternalReference());
	}
}

import { sendMessage } from '../../../../../lib/server';
import type { FederatedRoom } from '../../../domain/FederatedRoom';
import type { FederatedUser } from '../../../domain/FederatedUser';

export class RocketChatMessageAdapter {
	public async sendMessage(user: FederatedUser, text: string, room: FederatedRoom): Promise<void> {
		new Promise((resolve) => resolve(sendMessage(user.internalReference, { msg: text }, room.internalReference)));
	}
}

import { sendMessage } from '../../../../../lib/server';
import { FederatedRoom } from '../../../domain/FederatedRoom';
import { FederatedUser } from '../../../domain/FederatedUser';

export class RocketChatMessageAdapter {
	public async sendMessage(user: FederatedUser, room: FederatedRoom, messageText: string): Promise<void> {
		Promise.resolve(sendMessage(user.getInternalReference(), { msg: messageText }, room.getInternalReference()));
	}
}

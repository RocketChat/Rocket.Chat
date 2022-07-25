import { sendMessage } from '../../../../../lib/server';
import { FederatedRoom } from '../../../domain/FederatedRoom';
import { FederatedUser } from '../../../domain/FederatedUser';

export class RocketChatMessageAdapter {
	public async sendMessage(user: FederatedUser, text: string, room: FederatedRoom): Promise<void> {
		Promise.resolve(sendMessage(user.internalReference, { msg: text }, room.internalReference));
	}
}

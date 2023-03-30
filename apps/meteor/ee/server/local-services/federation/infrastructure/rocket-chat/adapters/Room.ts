import { createDirectMessage } from '../../../../../../../server/methods/createDirectMessage';
import { RocketChatRoomAdapter } from '../../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Room';

export class RocketChatRoomAdapterEE extends RocketChatRoomAdapter {
	public async createLocalDirectMessageRoom(members: string[], creatorId: string): Promise<void> {
		await createDirectMessage(members, creatorId);
	}
}

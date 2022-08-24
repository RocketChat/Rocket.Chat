import { RocketChatRoomAdapter } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Room';
import { createDirectMessage } from '../../../../../../../server/methods/createDirectMessage';

export class RocketChatRoomAdapterEE extends RocketChatRoomAdapter {
	public async createLocalDirectMessageRoom(members: string[], creatorId: string): Promise<void> {
		createDirectMessage(members, creatorId);
	}
}

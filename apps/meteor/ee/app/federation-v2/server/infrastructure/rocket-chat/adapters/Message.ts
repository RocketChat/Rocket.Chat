import { RocketChatMessageAdapter } from '../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/adapters/Message';
import { Messages } from '../../../../../../../app/models/server';
import { FederatedUserEE } from '../../../domain/FederatedUser';

export class RocketChatMessageAdapterEE extends RocketChatMessageAdapter {

    public async sendJoinedRoomMessage(internalRoomId: string, federatedUser: FederatedUserEE): Promise<void> {
        Messages.createUserJoinWithRoomIdAndUser(internalRoomId, federatedUser.getInternalReference(), { ts: new Date() });
    }
}
import type { IMessage } from '../messages/index';
import type { IRoom } from '../rooms/IRoom';
import type { IUser } from '../users/IUser';

/**
 * This accessor provides methods for accessing
 * messages in a read-only-fashion.
 */
export interface IMessageRead {
    getById(id: string): Promise<IMessage | undefined>;

    getSenderUser(messageId: string): Promise<IUser | undefined>;

    getRoom(messageId: string): Promise<IRoom | undefined>;
}

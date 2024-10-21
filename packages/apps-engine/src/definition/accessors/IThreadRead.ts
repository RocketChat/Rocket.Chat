import type { IMessage } from '../messages/index';

/**
 * This accessor provides methods for accessing
 * Thread messages in a read-only-fashion.
 */
export interface IThreadRead {
    getThreadById(id: string): Promise<Array<IMessage> | undefined>;
}

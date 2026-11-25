import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';

/** A persistent conference link: a named address in a room under which its conferences are started and joined. */
export interface IVideoConferenceRoom extends IRocketChatRecord {
	rid: IRoom['_id'];
	createdAt: Date;
	providerName: string;
	title: string;
	createdBy: Pick<IUser, '_id' | 'name' | 'username'>;
	/** The link's address, unique among links and never shaped like a conference id. */
	url: string;
}

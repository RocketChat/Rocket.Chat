import type { AtLeast, IMediaCallChannel, IUser, MediaCallActor } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';
export declare function createInitialChannel(callId: string, actor: MediaCallActor, channelData: AtLeast<InsertionModel<IMediaCallChannel>, 'role'>, userData?: Pick<IUser, '_id' | 'name' | 'username'>): Promise<void>;

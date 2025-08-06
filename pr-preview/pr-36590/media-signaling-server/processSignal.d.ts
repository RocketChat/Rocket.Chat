import type { IUser } from '@rocket.chat/core-typings';
import type { AgentMediaSignal } from '@rocket.chat/media-signaling';
export declare function processSignal(signal: AgentMediaSignal, uid: IUser['_id']): Promise<void>;

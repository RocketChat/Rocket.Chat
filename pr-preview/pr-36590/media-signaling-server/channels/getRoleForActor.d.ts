import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';
export declare function getRoleForActor(call: IMediaCall, actor: MediaCallActor): CallRole | null;

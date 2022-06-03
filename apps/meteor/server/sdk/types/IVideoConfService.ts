import type { IUser, IRoom, IVideoConference, VideoConference, VideoConferenceInstructions } from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

export type VideoConferenceJoinOptions = {
	mic?: boolean;
	cam?: boolean;
};

export interface IVideoConfService {
	start(caller: IUser['_id'], rid: string, title?: string): Promise<VideoConferenceInstructions>;
	join(uid: IUser['_id'], callId: IVideoConference['_id'], options: VideoConferenceJoinOptions): Promise<string>;
	cancel(uid: IUser['_id'], callId: IVideoConference['_id']): Promise<void>;
	get(callId: IVideoConference['_id']): Promise<IVideoConference | null>;
	list(roomId: IRoom['_id'], pagination?: { offset?: number; count?: number }): Promise<PaginatedResult<{ data: VideoConference[] }>>;
	setProviderData(callId: IVideoConference['_id'], data: IVideoConference['providerData'] | undefined): Promise<void>;
}

import type { IUser, IVideoConference, VideoConferenceInstructions } from '@rocket.chat/core-typings';

export type VideoConferenceJoinOptions = {
	mic?: boolean;
	cam?: boolean;
};

export interface IVideoConfService {
	start(caller: IUser['_id'], rid: string): Promise<VideoConferenceInstructions>;
	join(uid: IUser['_id'], callId: IVideoConference['_id'], options: VideoConferenceJoinOptions): Promise<string>;
	cancel(uid: IUser['_id'], callId: IVideoConference['_id']): Promise<void>;
	get(callId: IVideoConference['_id']): Promise<IVideoConference | null>;
}

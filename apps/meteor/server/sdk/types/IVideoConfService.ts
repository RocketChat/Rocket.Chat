import type {
	AtLeast,
	IDirectVideoConference,
	IGroupVideoConference,
	ILivechatVideoConference,
	IRoom,
	IUser,
	VideoConference,
	VideoConferenceInstructions,
} from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

export type VideoConferenceJoinOptions = {
	mic?: boolean;
	cam?: boolean;
};

type GroupVideoConferenceCreateData = Omit<IGroupVideoConference, 'createdBy'> & { createdBy: IUser['_id'] };
type DirectVideoConferenceCreateData = Omit<IDirectVideoConference, 'createdBy'> & { createdBy: IUser['_id'] };
type LivechatVideoConferenceCreateData = Omit<ILivechatVideoConference, 'createdBy'> & { createdBy: IUser['_id'] };

export type VideoConferenceCreateData = AtLeast<
	DirectVideoConferenceCreateData | GroupVideoConferenceCreateData | LivechatVideoConferenceCreateData,
	'createdBy' | 'type' | 'rid' | 'providerName' | 'providerData'
>;

export interface IVideoConfService {
	create(data: VideoConferenceCreateData): Promise<VideoConferenceInstructions>;
	start(caller: IUser['_id'], rid: string, title?: string): Promise<VideoConferenceInstructions>;
	join(uid: IUser['_id'], callId: VideoConference['_id'], options: VideoConferenceJoinOptions): Promise<string>;
	cancel(uid: IUser['_id'], callId: VideoConference['_id']): Promise<void>;
	get(callId: VideoConference['_id']): Promise<Omit<VideoConference, 'providerData'> | null>;
	getUnfiltered(callId: VideoConference['_id']): Promise<VideoConference | null>;
	list(roomId: IRoom['_id'], pagination?: { offset?: number; count?: number }): Promise<PaginatedResult<{ data: VideoConference[] }>>;
	setProviderData(callId: VideoConference['_id'], data: VideoConference['providerData'] | undefined): Promise<void>;
	setEndedBy(callId: VideoConference['_id'], endedBy: IUser['_id']): Promise<void>;
	setEndedAt(callId: VideoConference['_id'], endedAt: Date): Promise<void>;
	setStatus(callId: VideoConference['_id'], status: VideoConference['status']): Promise<void>;
	addUser(callId: VideoConference['_id'], userId: IUser['_id'], ts?: Date): Promise<void>;
	listProviders(): Promise<{ key: string; label: string }[]>;
	endLivechatCall(callId: VideoConference['_id']): Promise<boolean>;
}

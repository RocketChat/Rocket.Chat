import type { IVideoConferenceUser } from './IVideoConferenceUser';

export type VideoConferenceMember = IVideoConferenceUser & {
    ts: Date;
    avatarETag?: string;
};

export enum VideoConferenceStatus {
    CALLING = 0,
    STARTED = 1,
    EXPIRED = 2,
    ENDED = 3,
    DECLINED = 4,
}

export interface IVideoConference {
    _id: string;
    _updatedAt: Date;
    type: 'direct' | 'videoconference' | 'livechat';
    rid: string;
    users: Array<VideoConferenceMember>;
    status: VideoConferenceStatus;
    messages: {
        started?: string;
        ended?: string;
    };
    url?: string;

    createdBy: IVideoConferenceUser;
    createdAt: Date;

    endedBy?: IVideoConferenceUser;
    endedAt?: Date;

    providerName: string;
    providerData?: Record<string, any>;

    ringing?: boolean;
    discussionRid?: string;
}

export interface IDirectVideoConference extends IVideoConference {
    type: 'direct';
}

export interface IGroupVideoConference extends IVideoConference {
    type: 'videoconference';
    anonymousUsers: number;
    title: string;
}

export interface ILivechatVideoConference extends IVideoConference {
    type: 'livechat';
}

export type VideoConference = IDirectVideoConference | IGroupVideoConference | ILivechatVideoConference;

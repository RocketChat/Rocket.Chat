import type { IGroupVideoConference, IVideoConference } from '../videoConferences/IVideoConference';

export type VideoConfData = Pick<IVideoConference, '_id' | 'type' | 'rid' | 'createdBy' | 'providerData' | 'discussionRid'> & {
    title?: IGroupVideoConference['title'];
};

export type VideoConfDataExtended = VideoConfData & Required<Pick<IVideoConference, 'url'>>;

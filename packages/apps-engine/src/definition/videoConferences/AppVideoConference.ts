import type { IGroupVideoConference } from './IVideoConference';

// Type for video conferences being created by an app
export type AppVideoConference = Pick<IGroupVideoConference, 'rid' | 'providerName' | 'providerData' | 'title' | 'discussionRid'> & {
    createdBy: IGroupVideoConference['createdBy']['_id'];
};

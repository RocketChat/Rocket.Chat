import type { IGroupVideoConference } from './IVideoConference';
export type AppVideoConference = Pick<IGroupVideoConference, 'rid' | 'providerName' | 'providerData' | 'title' | 'discussionRid'> & {
    createdBy: IGroupVideoConference['createdBy']['_id'];
};

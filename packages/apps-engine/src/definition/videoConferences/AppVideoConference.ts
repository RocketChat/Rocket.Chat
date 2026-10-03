import type { IGroupVideoConference } from './IVideoConference';

/**
 * What an App supplies to open a conference through
 * `IModifyCreator.startVideoConference`.
 *
 * Everything else on {@link IGroupVideoConference} — the id, the status, the
 * participants — is the workspace's to fill in.
 */
export type AppVideoConference = Pick<IGroupVideoConference, 'rid' | 'providerName' | 'providerData' | 'title' | 'discussionRid'> & {
	createdBy: IGroupVideoConference['createdBy']['_id'];
};

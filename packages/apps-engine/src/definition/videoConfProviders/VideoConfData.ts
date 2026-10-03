import type { IGroupVideoConference, IVideoConference } from '../videoConferences/IVideoConference';

/**
 * The conference as `IVideoConfProvider.generateUrl` sees it: everything known
 * before the external service has been asked for a URL.
 */
export type VideoConfData = Pick<IVideoConference, '_id' | 'type' | 'rid' | 'createdBy' | 'providerData' | 'discussionRid'> & {
	title?: IGroupVideoConference['title'];
};

/**
 * {@link VideoConfData} once the conference has a URL, as
 * `IVideoConfProvider.customizeUrl` sees it.
 */
export type VideoConfDataExtended = VideoConfData & Required<Pick<IVideoConference, 'url'>>;

import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IBlock } from '../uikit';
import type { IVideoConferenceOptions } from './IVideoConferenceOptions';
import type { VideoConfData, VideoConfDataExtended } from './VideoConfData';
import type { VideoConference } from '../videoConferences/IVideoConference';
import type { IVideoConferenceUser } from '../videoConferences/IVideoConferenceUser';
/**
 * Represents a video conference provider
 */
export interface IVideoConfProvider {
    name: string;
    capabilities?: {
        mic?: boolean;
        cam?: boolean;
        title?: boolean;
        persistentChat?: boolean;
    };
    isFullyConfigured?(read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<boolean>;
    onNewVideoConference?(call: VideoConference, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void>;
    onVideoConferenceChanged?(call: VideoConference, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void>;
    onUserJoin?(call: VideoConference, user: IVideoConferenceUser | undefined, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void>;
    getVideoConferenceInfo?(call: VideoConference, user: IVideoConferenceUser | undefined, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<Array<IBlock>>;
    /**
     * The function which gets called when a new video conference url is requested
     */
    generateUrl(call: VideoConfData, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<string>;
    /**
     * The function which gets called whenever a user join url is requested
     */
    customizeUrl(call: VideoConfDataExtended, user: IVideoConferenceUser | undefined, options: IVideoConferenceOptions | undefined, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<string>;
}

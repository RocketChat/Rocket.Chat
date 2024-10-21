import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { IBlock } from '../uikit';
import type { VideoConference } from '../videoConferences/IVideoConference';
import type { IVideoConferenceUser } from '../videoConferences/IVideoConferenceUser';
import type { IVideoConferenceOptions } from './IVideoConferenceOptions';
import type { VideoConfData, VideoConfDataExtended } from './VideoConfData';

/**
 * Represents a video conference provider
 */
export interface IVideoConfProvider {
    name: string;

    capabilities?: {
        // Indicates if Rocket.Chat can determine if the user's microphone will start muted or not
        mic?: boolean;
        // Indicates if Rocket.Chat can determine if the user's camera will start turned on or not
        cam?: boolean;
        // Indicates if Rocket.Chat can send a custom title for the video conferences
        title?: boolean;
        // Indicates if the provider supports Rocket.Chat's Persistent Chat feature on its conferences.
        persistentChat?: boolean;
    };

    // Optional function that can be used to determine if the provider is ready to use or still needs to be configured
    isFullyConfigured?(read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<boolean>;

    // Optional function to run when a new video conference is created on this provider
    onNewVideoConference?(call: VideoConference, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void>;

    // Optional function to run when a video conference from this provider is changed by rocket.chat
    onVideoConferenceChanged?(call: VideoConference, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void>;

    // Optional function to run when a new user joins a video conference from this provider
    onUserJoin?(call: VideoConference, user: IVideoConferenceUser | undefined, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void>;

    // Optional function to run when the 'info' button of a video conference is clicked - must return blocks for a UiKit modal
    getVideoConferenceInfo?(
        call: VideoConference,
        user: IVideoConferenceUser | undefined,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<Array<IBlock>>;

    /**
     * The function which gets called when a new video conference url is requested
     */
    generateUrl(call: VideoConfData, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<string>;
    /**
     * The function which gets called whenever a user join url is requested
     */
    customizeUrl(
        call: VideoConfDataExtended,
        user: IVideoConferenceUser | undefined,
        options: IVideoConferenceOptions | undefined,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<string>;
}

import type { IVideoConferenceRead } from '../../definition/accessors';
import type { VideoConference } from '../../definition/videoConferences';
import type { VideoConferenceBridge } from '../bridges';
export declare class VideoConferenceRead implements IVideoConferenceRead {
    private videoConfBridge;
    private appId;
    constructor(videoConfBridge: VideoConferenceBridge, appId: string);
    getById(id: string): Promise<VideoConference>;
}

import type { IVideoConferenceExtender } from '../../definition/accessors';
import { RocketChatAssociationModel } from '../../definition/metadata';
import type { IVideoConferenceUser, VideoConference } from '../../definition/videoConferences';
import type { VideoConferenceMember } from '../../definition/videoConferences/IVideoConference';
export declare class VideoConferenceExtender implements IVideoConferenceExtender {
    private videoConference;
    kind: RocketChatAssociationModel.VIDEO_CONFERENCE;
    constructor(videoConference: VideoConference);
    setProviderData(value: Record<string, any>): IVideoConferenceExtender;
    setStatus(value: VideoConference['status']): IVideoConferenceExtender;
    setEndedBy(value: IVideoConferenceUser['_id']): IVideoConferenceExtender;
    setEndedAt(value: VideoConference['endedAt']): IVideoConferenceExtender;
    addUser(userId: VideoConferenceMember['_id'], ts?: VideoConferenceMember['ts']): IVideoConferenceExtender;
    setDiscussionRid(rid: VideoConference['discussionRid']): IVideoConferenceExtender;
    getVideoConference(): VideoConference;
}

import type { IVideoConferenceExtender } from '../../definition/accessors';
import { RocketChatAssociationModel } from '../../definition/metadata';
import type { IVideoConferenceUser, VideoConference } from '../../definition/videoConferences';
import type { VideoConferenceMember } from '../../definition/videoConferences/IVideoConference';
import { Utilities } from '../misc/Utilities';

export class VideoConferenceExtender implements IVideoConferenceExtender {
    public kind: RocketChatAssociationModel.VIDEO_CONFERENCE;

    constructor(private videoConference: VideoConference) {
        this.kind = RocketChatAssociationModel.VIDEO_CONFERENCE;
    }

    public setProviderData(value: Record<string, any>): IVideoConferenceExtender {
        this.videoConference.providerData = value;

        return this;
    }

    public setStatus(value: VideoConference['status']): IVideoConferenceExtender {
        this.videoConference.status = value;

        return this;
    }

    public setEndedBy(value: IVideoConferenceUser['_id']): IVideoConferenceExtender {
        this.videoConference.endedBy = {
            _id: value,
            // Name and username will be loaded automatically by the bridge
            username: '',
            name: '',
        };

        return this;
    }

    public setEndedAt(value: VideoConference['endedAt']): IVideoConferenceExtender {
        this.videoConference.endedAt = value;

        return this;
    }

    public addUser(userId: VideoConferenceMember['_id'], ts?: VideoConferenceMember['ts']): IVideoConferenceExtender {
        this.videoConference.users.push({
            _id: userId,
            ts,
            // Name and username will be loaded automatically by the bridge
            username: '',
            name: '',
        });

        return this;
    }

    public setDiscussionRid(rid: VideoConference['discussionRid']): IVideoConferenceExtender {
        this.videoConference.discussionRid = rid;

        return this;
    }

    public getVideoConference(): VideoConference {
        return Utilities.deepClone(this.videoConference);
    }
}

import type { IVideoConferenceExtender } from '@rocket.chat/apps-engine/definition/accessors/IVideoConferenceExtend.ts';
import type { VideoConference, VideoConferenceMember } from '@rocket.chat/apps-engine/definition/videoConferences/IVideoConference.ts';
import type { IVideoConferenceUser } from '@rocket.chat/apps-engine/definition/videoConferences/IVideoConferenceUser.ts';
import type { RocketChatAssociationModel as _RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.ts';

import { require } from '../../../lib/require.ts';

const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js') as {
    RocketChatAssociationModel: typeof _RocketChatAssociationModel;
};

export class VideoConferenceExtender implements IVideoConferenceExtender {
    public kind: _RocketChatAssociationModel.VIDEO_CONFERENCE;

    constructor(private videoConference: VideoConference) {
        this.kind = RocketChatAssociationModel.VIDEO_CONFERENCE;
    }

    public setProviderData(value: Record<string, unknown>): IVideoConferenceExtender {
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
        return structuredClone(this.videoConference);
    }
}

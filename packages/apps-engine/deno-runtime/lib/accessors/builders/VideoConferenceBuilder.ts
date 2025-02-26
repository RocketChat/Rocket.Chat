import type { IVideoConferenceBuilder } from '@rocket.chat/apps-engine/definition/accessors/IVideoConferenceBuilder.ts';
import type { IGroupVideoConference } from '@rocket.chat/apps-engine/definition/videoConferences/IVideoConference.ts';

import type { RocketChatAssociationModel as _RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.ts';

import { require } from '../../../lib/require.ts';

const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js') as {
    RocketChatAssociationModel: typeof _RocketChatAssociationModel;
};

export type AppVideoConference = Pick<IGroupVideoConference, 'rid' | 'providerName' | 'providerData' | 'title' | 'discussionRid'> & {
    createdBy: IGroupVideoConference['createdBy']['_id'];
};

export class VideoConferenceBuilder implements IVideoConferenceBuilder {
    public kind: _RocketChatAssociationModel.VIDEO_CONFERENCE = RocketChatAssociationModel.VIDEO_CONFERENCE;

    protected call: AppVideoConference;

    constructor(data?: Partial<AppVideoConference>) {
        this.call = (data || {}) as AppVideoConference;
    }

    public setData(data: Partial<AppVideoConference>): IVideoConferenceBuilder {
        this.call = {
            rid: data.rid!,
            createdBy: data.createdBy,
            providerName: data.providerName!,
            title: data.title!,
            discussionRid: data.discussionRid,
        };

        return this;
    }

    public setRoomId(rid: string): IVideoConferenceBuilder {
        this.call.rid = rid;
        return this;
    }

    public getRoomId(): string {
        return this.call.rid;
    }

    public setCreatedBy(userId: string): IVideoConferenceBuilder {
        this.call.createdBy = userId;
        return this;
    }

    public getCreatedBy(): string {
        return this.call.createdBy;
    }

    public setProviderName(userId: string): IVideoConferenceBuilder {
        this.call.providerName = userId;
        return this;
    }

    public getProviderName(): string {
        return this.call.providerName;
    }

    public setProviderData(data: Record<string, unknown> | undefined): IVideoConferenceBuilder {
        this.call.providerData = data;
        return this;
    }

    public getProviderData(): Record<string, unknown> {
        return this.call.providerData!;
    }

    public setTitle(userId: string): IVideoConferenceBuilder {
        this.call.title = userId;
        return this;
    }

    public getTitle(): string {
        return this.call.title;
    }

    public setDiscussionRid(rid: AppVideoConference['discussionRid']): IVideoConferenceBuilder {
        this.call.discussionRid = rid;
        return this;
    }

    public getDiscussionRid(): AppVideoConference['discussionRid'] {
        return this.call.discussionRid;
    }

    public getVideoConference(): AppVideoConference {
        return this.call;
    }
}

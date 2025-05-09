import type { IVideoConferenceBuilder } from '../../definition/accessors';
import { RocketChatAssociationModel } from '../../definition/metadata';
import type { AppVideoConference } from '../../definition/videoConferences';

export class VideoConferenceBuilder implements IVideoConferenceBuilder {
    public kind: RocketChatAssociationModel.VIDEO_CONFERENCE = RocketChatAssociationModel.VIDEO_CONFERENCE;

    protected call: AppVideoConference;

    constructor(data?: Partial<AppVideoConference>) {
        this.call = (data || {}) as AppVideoConference;
    }

    public setData(data: Partial<AppVideoConference>): IVideoConferenceBuilder {
        this.call = {
            rid: data.rid,
            createdBy: data.createdBy,
            providerName: data.providerName,
            title: data.title,
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

    public setProviderData(data: Record<string, any> | undefined): IVideoConferenceBuilder {
        this.call.providerData = data;
        return this;
    }

    public getProviderData(): Record<string, any> | undefined {
        return this.call.providerData;
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

import type { IVideoConferenceBuilder } from '../../definition/accessors';
import { RocketChatAssociationModel } from '../../definition/metadata';
import type { AppVideoConference } from '../../definition/videoConferences';
export declare class VideoConferenceBuilder implements IVideoConferenceBuilder {
    kind: RocketChatAssociationModel.VIDEO_CONFERENCE;
    protected call: AppVideoConference;
    constructor(data?: Partial<AppVideoConference>);
    setData(data: Partial<AppVideoConference>): IVideoConferenceBuilder;
    setRoomId(rid: string): IVideoConferenceBuilder;
    getRoomId(): string;
    setCreatedBy(userId: string): IVideoConferenceBuilder;
    getCreatedBy(): string;
    setProviderName(userId: string): IVideoConferenceBuilder;
    getProviderName(): string;
    setProviderData(data: Record<string, any> | undefined): IVideoConferenceBuilder;
    getProviderData(): Record<string, any> | undefined;
    setTitle(userId: string): IVideoConferenceBuilder;
    getTitle(): string;
    setDiscussionRid(rid: AppVideoConference['discussionRid']): IVideoConferenceBuilder;
    getDiscussionRid(): AppVideoConference['discussionRid'];
    getVideoConference(): AppVideoConference;
}

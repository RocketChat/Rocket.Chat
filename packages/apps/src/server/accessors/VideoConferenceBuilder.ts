import type { IVideoConferenceBuilder } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata';
import type { AppVideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';

export class VideoConferenceBuilder implements IVideoConferenceBuilder {
	public kind: RocketChatAssociationModel.VIDEO_CONFERENCE = RocketChatAssociationModel.VIDEO_CONFERENCE;

	protected call: AppVideoConference;

	constructor(data?: Partial<AppVideoConference>) {
		this.call = (data || {}) as AppVideoConference;
	}

	public setData(data: Partial<AppVideoConference>): IVideoConferenceBuilder {
		this.call = {
			rid: data.rid as string,
			createdBy: data.createdBy as string,
			providerName: data.providerName as string,
			title: data.title as string,
			discussionRid: data.discussionRid,
		};

		return this as IVideoConferenceBuilder;
	}

	public setRoomId(rid: string): IVideoConferenceBuilder {
		this.call.rid = rid;
		return this as IVideoConferenceBuilder;
	}

	public getRoomId(): string {
		return this.call.rid;
	}

	public setCreatedBy(userId: string): IVideoConferenceBuilder {
		this.call.createdBy = userId;
		return this as IVideoConferenceBuilder;
	}

	public getCreatedBy(): string {
		return this.call.createdBy;
	}

	public setProviderName(userId: string): IVideoConferenceBuilder {
		this.call.providerName = userId;
		return this as IVideoConferenceBuilder;
	}

	public getProviderName(): string {
		return this.call.providerName;
	}

	public setProviderData(data: Record<string, any>): IVideoConferenceBuilder {
		this.call.providerData = data;
		return this as IVideoConferenceBuilder;
	}

	public getProviderData(): Record<string, any> {
		return this.call.providerData as Record<string, any>;
	}

	public setTitle(userId: string): IVideoConferenceBuilder {
		this.call.title = userId;
		return this as IVideoConferenceBuilder;
	}

	public getTitle(): string {
		return this.call.title;
	}

	public setDiscussionRid(rid: AppVideoConference['discussionRid']): IVideoConferenceBuilder {
		this.call.discussionRid = rid;
		return this as IVideoConferenceBuilder;
	}

	public getDiscussionRid(): AppVideoConference['discussionRid'] {
		return this.call.discussionRid;
	}

	public getVideoConference(): AppVideoConference {
		return this.call;
	}
}

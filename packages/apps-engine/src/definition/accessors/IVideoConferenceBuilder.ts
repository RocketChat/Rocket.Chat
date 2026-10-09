import type { RocketChatAssociationModel } from '../metadata';
import type { AppVideoConference } from '../videoConferences';

/**
 * Builds a video conference before it is opened.
 *
 * Get one from `IModifyCreator.startVideoConference`; the conference exists
 * once `IModifyCreator.finish` is called with it.
 */
export interface IVideoConferenceBuilder {
	kind: RocketChatAssociationModel.VIDEO_CONFERENCE;

	setData(call: Partial<AppVideoConference>): IVideoConferenceBuilder;

	setRoomId(rid: string): IVideoConferenceBuilder;

	getRoomId(): string;

	setCreatedBy(userId: string): IVideoConferenceBuilder;

	getCreatedBy(): string;

	setProviderName(name: string): IVideoConferenceBuilder;

	getProviderName(): string;

	setProviderData(data: Record<string, any>): IVideoConferenceBuilder;

	getProviderData(): Record<string, any>;

	setTitle(name: string): IVideoConferenceBuilder;

	getTitle(): string;

	setDiscussionRid(rid: string | undefined): IVideoConferenceBuilder;

	getDiscussionRid(): string | undefined;

	getVideoConference(): AppVideoConference;
}

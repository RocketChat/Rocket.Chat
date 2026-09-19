/** The kind of record a {@link RocketChatAssociationRecord} points at. */
export enum RocketChatAssociationModel {
	ROOM = 'room',
	DISCUSSION = 'discussion',
	MESSAGE = 'message',
	LIVECHAT_MESSAGE = 'livechat-message',
	USER = 'user',
	FILE = 'file',
	MISC = 'misc',
	VIDEO_CONFERENCE = 'video-conference',
}

/**
 * A tag that ties persisted data to the record it belongs to.
 *
 * `IPersistence` and `IPersistenceRead` take these instead of raw ids, so an
 * App can store data against a room, a message or a user and later read it back
 * — or have it removed with the record — without maintaining its own index.
 * Use {@link RocketChatAssociationModel.MISC} for data that belongs to no
 * particular record.
 */
export class RocketChatAssociationRecord {
	constructor(
		private model: RocketChatAssociationModel,
		private id: string,
	) {}

	/** The kind of record this association points at. */
	public getModel() {
		return this.model;
	}

	/** The id of the record this association points at. */
	public getID() {
		return this.id;
	}
}

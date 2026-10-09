/** Which kind of conversation an {@link rooms/IRoom!IRoom | IRoom} is. */
export enum RoomType {
	/** A channel anyone on the workspace can find and join. */
	CHANNEL = 'c',
	/** A group only invited members can see. */
	PRIVATE_GROUP = 'p',
	/** A conversation between a fixed set of users. */
	DIRECT_MESSAGE = 'd',
	/** A conversation with a Livechat visitor. */
	LIVE_CHAT = 'l',
}

export type PreviewRoomInput = {
	isPublicChannel: boolean;
	allowAnonymousRead: boolean;
	canPreviewChannelRoom: boolean;
	subscribed: boolean;
};

/** Decides whether someone gets to read a room they may not have joined. */
export const canPreviewRoom = ({ isPublicChannel, allowAnonymousRead, canPreviewChannelRoom, subscribed }: PreviewRoomInput): boolean => {
	// Only a public channel is gated here; who may open any other room type, livechat included, is decided when the room loads.
	if (!isPublicChannel) {
		return true;
	}

	return allowAnonymousRead || canPreviewChannelRoom || subscribed;
};

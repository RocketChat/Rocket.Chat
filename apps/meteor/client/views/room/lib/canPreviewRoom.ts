export type PreviewRoomInput = {
	isPublicChannel: boolean;
	allowAnonymousRead: boolean;
	canPreviewChannelRoom: boolean;
	subscribed: boolean;
};

/** Decides whether someone gets to read a room they may not have joined. */
export const canPreviewRoom = ({ isPublicChannel, allowAnonymousRead, canPreviewChannelRoom, subscribed }: PreviewRoomInput): boolean => {
	// Only a public channel is ever withheld. Anything else is already private, and being there is the permission.
	if (!isPublicChannel) {
		return true;
	}

	return allowAnonymousRead || canPreviewChannelRoom || subscribed;
};

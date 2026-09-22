import { getURL } from './getURL';

export const getAvatarURL = ({
	username,
	roomId,
	contactId,
	cache,
}: {
	username?: string;
	roomId?: string;
	contactId?: string;
	cache?: string;
}): string | undefined => {
	if (username) {
		return getURL(`/avatar/${encodeURIComponent(username)}${cache ? `?etag=${cache}` : ''}`);
	}
	if (roomId) {
		return getURL(`/avatar/room/${encodeURIComponent(roomId)}${cache ? `?etag=${cache}` : ''}`);
	}
	if (contactId) {
		return getURL(`/avatar/contact/${encodeURIComponent(contactId)}${cache ? `?etag=${cache}` : ''}`);
	}
};

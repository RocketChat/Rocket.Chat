import { getURL } from './getURL';

export const getAvatarURL = ({ username, roomId, cache }: { username?: string; roomId?: string; cache?: string }): string | undefined => {
	if (username) {
		return getURL(`/avatar/${encodeURIComponent(username)}${cache ? `?etag=${cache}` : ''}`);
	}
	if (roomId) {
		return getURL(`/avatar/room/${encodeURIComponent(roomId)}${cache ? `?etag=${cache}` : ''}`);
	}
};

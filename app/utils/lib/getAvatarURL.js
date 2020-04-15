import { getURL } from './getURL';

export const getAvatarURL = ({ username, roomId, cache }) => {
	if (username) {
		return getURL(`/avatar/${ encodeURIComponent(username) }${ cache ? `?_dc=${ cache }` : '' }`);
	}
	if (roomId) {
		return getURL(`/avatar/room/${ encodeURIComponent(roomId) }${ cache ? `?_dc=${ cache }` : '' }`);
	}
};

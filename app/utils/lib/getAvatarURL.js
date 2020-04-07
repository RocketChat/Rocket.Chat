import { getURL } from './getURL';

const addColorParameterIfNeeds = (color, cache) => {
	if (!color) {
		return '';
	}
	return `${ cache ? '&' : '?' }avatarColor=${ encodeURIComponent(color) }`;
};

export const getAvatarURL = ({ username, roomId, color, cache }) => {
	if (username) {
		return getURL(`/avatar/${ encodeURIComponent(username) }${ cache ? `?_dc=${ cache }` : '' }${ addColorParameterIfNeeds(color, cache) }`);
	}
	if (roomId) {
		return getURL(`/avatar/room/${ encodeURIComponent(roomId) }${ cache ? `?_dc=${ cache }` : '' }${ addColorParameterIfNeeds(color, cache) }`);
	}
};

import { getAvatarURL } from './getAvatarURL';

export const getUserAvatarURL = function (username: string, cache = ''): string | undefined {
	if (username == null) {
		return;
	}

	return getAvatarURL({ username, cache });
};

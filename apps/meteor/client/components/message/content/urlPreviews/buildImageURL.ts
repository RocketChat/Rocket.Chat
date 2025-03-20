import { isValidLink } from '../../../../views/room/MessageList/lib/isValidLink';

export const buildImageURL = (url: string, imageUrl: string): string => {
	if (isValidLink(imageUrl)) {
		return JSON.stringify(imageUrl);
	}

	const { origin } = new URL(url);
	const imgURL = `${origin}/${imageUrl}`;
	const normalizedUrl = imgURL.replace(/([^:]\/)\/+/gm, '$1');

	return JSON.stringify(normalizedUrl);
};

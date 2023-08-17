import { parse } from '@rocket.chat/message-parser';

export const normalizeUrl = (url: string): string | undefined => {
	if (url.startsWith('http')) {
		return url;
	}

	if (url.startsWith('//')) {
		return `https:${url}`;
	}

	const parsedUrl = parse(url);

	if (parsedUrl[0].type === 'PARAGRAPH') {
		if (parsedUrl[0].value[0].type === 'LINK') {
			if (parsedUrl[0].value[0].value.src.value.startsWith('//')) {
				return `https:${parsedUrl[0].value[0].value.src.value}`;
			}

			return parsedUrl[0].value[0].value.src.value;
		}
	}

	return undefined;
};

import { parse } from '@rocket.chat/message-parser';

export const normalizeUrl = (url: string): string => {
	const parsedUrl = parse(url);

	if (!parsedUrl?.length) {
		return '';
	}

	if (parsedUrl[0].type !== 'PARAGRAPH') {
		return url;
	}

	if (parsedUrl[0].value[0].type !== 'LINK') {
		return url;
	}

	return parsedUrl[0].value[0].value.src.value;
};

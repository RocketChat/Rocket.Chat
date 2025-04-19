import type { PDFMessage } from '..';

const MAX_MD_ELEMENTS_PER_VIEW = 10;
const MAX_MSG_SIZE = 1200;

export const messageLongerThanPage = (message: string | undefined) => (message?.length ?? 0) > MAX_MSG_SIZE;

// When a markup list is greater than 10 (magic number, but a reasonable small/big number) we're gonna split the markdown into multiple <View> element
// So react-pdf can split them evenly across pages
export const markupEntriesGreaterThan10 = (messageMd: unknown[] = []) => messageMd.length > MAX_MD_ELEMENTS_PER_VIEW;
export const splitByTens = (array: unknown[] = []): unknown[][] => {
	const result = [];
	for (let i = 0; i < array.length; i += 10) {
		result.push(array.slice(i, i + 10));
	}
	return result;
};

export const isSystemMessage = (message: PDFMessage) => !!message.t;

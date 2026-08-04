import type { Root } from '@rocket.chat/message-parser';

/**
 * Extracts all URLs from parsed message AST (message-parser output)
 * Looks for LINK nodes and extracts the src URL
 */
export const extractUrlsFromMessageAST = (md?: Root | Root[number] | Root[number]['value']): string[] => {
	if (!md || !Array.isArray(md)) {
		return [];
	}

	const urls: string[] = [];

	const walk = (node: any): void => {
		if (Array.isArray(node)) {
			node.forEach(walk);
			return;
		}
		if (typeof node !== 'object' || node === null) {
			return;
		}
		if (node.type === 'LINK' && node.value?.src?.value) {
			urls.push(node.value.src.value);
		}
		if (node.value !== undefined) {
			walk(node.value);
		}
	};

	walk(md);

	return urls;
};

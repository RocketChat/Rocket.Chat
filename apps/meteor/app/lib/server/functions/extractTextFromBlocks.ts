import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import type { Root } from '@rocket.chat/message-parser';

/**
 * Extracts all text content from message blocks (UI Kit)
 * Traverses through all block types and extracts text from TextObjects (plain_text and mrkdwn)
 */
export const extractTextFromBlocks = (blocks?: MessageSurfaceLayout): string[] => {
	if (!blocks || !Array.isArray(blocks)) {
		return [];
	}

	const textParts: string[] = [];

	const extractTextFromObject = (obj: Record<string, any> | any[] | null | undefined): void => {
		if (!obj || typeof obj !== 'object') {
			return;
		}

		// Handle text objects (PlainText and Markdown)
		if (obj.type === 'plain_text' || obj.type === 'mrkdwn') {
			if (typeof obj.text === 'string') {
				textParts.push(obj.text);
			}
		}

		// Handle arrays (e.g., fields, elements)
		if (Array.isArray(obj)) {
			obj.forEach((item) => extractTextFromObject(item));
			return;
		}

		// Recursively check all properties
		Object.values(obj).forEach((value) => {
			if (value && typeof value === 'object') {
				extractTextFromObject(value);
			}
		});
	};

	blocks.forEach((block) => extractTextFromObject(block));

	return textParts;
};

/**
 * Extracts all URLs from parsed message AST (message-parser output)
 * Looks for LINK nodes and extracts the src URL
 */
export const extractUrlsFromMessageAST = (md?: Root): string[] => {
	if (!md || !Array.isArray(md)) {
		return [];
	}

	const urls: string[] = [];

	const traverse = (node: Record<string, any> | any[] | null | undefined): void => {
		if (!node || typeof node !== 'object') {
			return;
		}

		// Handle LINK nodes - these contain the normalized URLs with proper schema
		if (node.type === 'LINK' && node.value?.src?.value) {
			let url = node.value.src.value;
			// If URL starts with //, convert to https://
			if (url.startsWith('//')) {
				url = 'https:' + url;
			}
			urls.push(url);
		}

		// Handle arrays
		if (Array.isArray(node)) {
			node.forEach((item) => traverse(item));
			return;
		}

		// Recursively traverse all properties
		if (node.value !== undefined) {
			traverse(node.value);
		}

		// For objects with other properties, traverse them
		Object.entries(node).forEach(([key, value]) => {
			if (key !== 'type' && value && typeof value === 'object') {
				traverse(value);
			}
		});
	};

	traverse(md);

	return urls;
};

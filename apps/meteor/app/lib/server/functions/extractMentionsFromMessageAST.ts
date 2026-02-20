import type { Root } from '@rocket.chat/message-parser';

type ExtractedMentions = {
	mentions: string[];
	channels: string[];
};

type ASTNode = {
	type: string;
	value?: unknown;
};

function isASTNode(node: unknown): node is ASTNode {
	return typeof node === 'object' && node !== null && 'type' in node;
}

function traverse(node: unknown, mentions: Set<string>, channels: Set<string>): void {
	if (!isASTNode(node)) {
		return;
	}

	if (node.type === 'MENTION_USER' && isASTNode(node.value) && node.value.type === 'PLAIN_TEXT') {
		const plainValue = node.value as { type: 'PLAIN_TEXT'; value: string };
		mentions.add(plainValue.value);
		return;
	}

	if (node.type === 'MENTION_CHANNEL' && isASTNode(node.value) && node.value.type === 'PLAIN_TEXT') {
		const plainValue = node.value as { type: 'PLAIN_TEXT'; value: string };
		channels.add(plainValue.value);
		return;
	}

	if (Array.isArray(node.value)) {
		for (const child of node.value) {
			traverse(child, mentions, channels);
		}
		return;
	}

	if (typeof node.value === 'object' && node.value !== null) {
		for (const key of Object.keys(node.value)) {
			traverse((node.value as Record<string, unknown>)[key], mentions, channels);
		}
	}
}

export function extractMentionsFromMessageAST(ast: Root): ExtractedMentions {
	const mentions = new Set<string>();
	const channels = new Set<string>();

	for (const node of ast) {
		traverse(node, mentions, channels);
	}

	return {
		mentions: Array.from(mentions),
		channels: Array.from(channels),
	};
}

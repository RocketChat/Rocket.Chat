import type { Root, Paragraph, Blocks, Inlines, UserMention, ChannelMention, Task, ListItem, BigEmoji } from '@rocket.chat/message-parser';

type ExtractedMentions = {
	mentions: string[];
	channels: string[];
};

type MessageNode = Paragraph | Blocks | Inlines | Task | ListItem | BigEmoji;

function isUserMention(node: MessageNode): node is UserMention {
	return node.type === 'MENTION_USER';
}

function isChannelMention(node: MessageNode): node is ChannelMention {
	return node.type === 'MENTION_CHANNEL';
}

function hasArrayValue(node: MessageNode): node is MessageNode & { value: MessageNode[] } {
	return Array.isArray(node.value);
}

function hasObjectValue(node: MessageNode): node is MessageNode & { value: Record<string, MessageNode> } {
	return typeof node.value === 'object' && node.value !== null && !Array.isArray(node.value);
}

function traverse(node: MessageNode, mentions: Set<string>, channels: Set<string>): void {
	if (isUserMention(node)) {
		mentions.add(node.value.value);
		return;
	}

	if (isChannelMention(node)) {
		channels.add(node.value.value);
		return;
	}

	if (hasArrayValue(node)) {
		for (const child of node.value) {
			traverse(child, mentions, channels);
		}
		return;
	}

	if (hasObjectValue(node)) {
		for (const key of Object.keys(node.value)) {
			traverse(node.value[key], mentions, channels);
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

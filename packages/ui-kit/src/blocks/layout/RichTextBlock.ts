import type { LayoutBlockish } from '../LayoutBlockish';

export type RichTextStyle = {
	bold?: boolean;
	italic?: boolean;
	strike?: boolean;
	code?: boolean;
};

export type RichTextTextElement = {
	type: 'text';
	text: string;
	style?: RichTextStyle;
};

export type RichTextLinkElement = {
	type: 'link';
	url: string;
	text?: string;
	style?: RichTextStyle;
};

export type RichTextEmojiElement = {
	type: 'emoji';
	name: string;
	unicode?: string;
};

export type RichTextUserElement = {
	type: 'user';
	user_id: string;
};

export type RichTextChannelElement = {
	type: 'channel';
	channel_id: string;
};

export type RichTextDateElement = {
	type: 'date';
	timestamp: number;
	format?: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';
};

export type RichTextBroadcastElement = {
	type: 'broadcast';
	range: 'here' | 'channel' | 'everyone';
};

export type RichTextInlineElement =
	| RichTextTextElement
	| RichTextLinkElement
	| RichTextEmojiElement
	| RichTextUserElement
	| RichTextChannelElement
	| RichTextDateElement
	| RichTextBroadcastElement;

export type RichTextSection = {
	type: 'rich_text_section';
	elements: RichTextInlineElement[];
};

export type RichTextList = {
	type: 'rich_text_list';
	style: 'bullet' | 'ordered';
	indent?: number;
	elements: RichTextSection[];
};

export type RichTextQuote = {
	type: 'rich_text_quote';
	elements: RichTextInlineElement[];
};

export type RichTextPreformatted = {
	type: 'rich_text_preformatted';
	elements: RichTextInlineElement[];
};

export type RichTextContainer = RichTextSection | RichTextList | RichTextQuote | RichTextPreformatted;

/** Structured rich text: sections, lists, quotes and code, with mentions given by id. */
export type RichTextBlock = LayoutBlockish<{
	type: 'rich_text';
	elements: RichTextContainer[];
}>;

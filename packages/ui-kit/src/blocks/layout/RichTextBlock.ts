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

/** A colour swatch with its hex value, as `#RRGGBB` or `#RRGGBBAA`. */
export type RichTextColorElement = {
	type: 'color';
	value: string;
};

export type RichTextTagColor = 'gray' | 'brown' | 'purple' | 'indigo' | 'blue' | 'green' | 'yellow' | 'orange' | 'red';

/** A short label drawn as a chip. */
export type RichTextTagElement = {
	type: 'tag';
	text: string;
	color?: RichTextTagColor;
	style?: RichTextStyle;
};

export type RichTextCitationDetails =
	| { citation_type: 'web'; display_name?: string; title?: string; snippet?: string }
	| { citation_type: 'external'; app_name?: string; app_icon_url?: string }
	| { citation_type: 'message'; channel: string; message_id: string }
	| { citation_type: 'file'; descriptor?: string; file_id: string };

/** A numbered reference to a source, drawn as a link labelled with its `index`. */
export type RichTextCitationElement = {
	type: 'citation';
	url: string;
	text: string;
	index: number;
	details?: RichTextCitationDetails;
	from_llm?: boolean;
};

/** A link to a message, by the id of the room that holds it and the id of the message. */
export type RichTextMessageMentionElement = {
	type: 'message_mention';
	channel_id: string;
	message_id: string;
	text?: string;
	url?: string;
	author_id?: string;
	style?: RichTextStyle;
};

export type RichTextAttachmentMentionElement = {
	type: 'attachment_mention';
	url: string;
	text?: string;
	app_id?: string;
	icon_url?: string;
	style?: RichTextStyle;
};

/** Mentions a team's members; Rocket.Chat has no user groups, so the id is a team id. */
export type RichTextUsergroupElement = {
	type: 'usergroup';
	usergroup_id: string;
	style?: RichTextStyle;
};

/** Mentions a team's main room by team id. */
export type RichTextTeamElement = {
	type: 'team';
	team_id: string;
	style?: RichTextStyle;
};

export type RichTextInlineElement =
	| RichTextTextElement
	| RichTextLinkElement
	| RichTextEmojiElement
	| RichTextUserElement
	| RichTextChannelElement
	| RichTextDateElement
	| RichTextBroadcastElement
	| RichTextColorElement
	| RichTextTagElement
	| RichTextCitationElement
	| RichTextMessageMentionElement
	| RichTextAttachmentMentionElement
	| RichTextUsergroupElement
	| RichTextTeamElement;

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

import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

/** Picks several conversations the user belongs to: channels, private groups or direct messages. Its value is the list of room ids. */
export type MultiConversationsSelectElement = Actionable<{
	type: 'multi_conversations_select';
	placeholder?: PlainText;
}>;

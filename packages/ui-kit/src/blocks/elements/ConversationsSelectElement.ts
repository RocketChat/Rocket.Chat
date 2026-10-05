import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

/** Picks one conversation the user belongs to: a channel, a private group or a direct message. Its value is the room id. */
export type ConversationsSelectElement = Actionable<{
	type: 'conversations_select';
	placeholder?: PlainText;
}>;

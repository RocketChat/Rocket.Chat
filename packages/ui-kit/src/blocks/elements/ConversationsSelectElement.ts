import type { Actionable } from '../Actionable';
import type { ConversationsSelectFilter } from './ConversationsSelectFilter';
import type { PlainText } from '../text/PlainText';

/** Picks one conversation the user belongs to: a channel, a private group or a direct message. Its value is the room id. */
export type ConversationsSelectElement = Actionable<{
	type: 'conversations_select';
	placeholder?: PlainText;
	/** Id of the room selected when the view opens. */
	initial_conversation?: string;
	/** Starts with the conversation the view was opened from when nothing else is selected. */
	default_to_current_conversation?: boolean;
	/** Which kinds of conversation to list; `im` and `mpim` both cover direct messages. */
	filter?: ConversationsSelectFilter;
}>;

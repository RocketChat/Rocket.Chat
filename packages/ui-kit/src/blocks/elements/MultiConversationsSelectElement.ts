import type { Actionable } from '../Actionable';
import type { ConversationsSelectFilter } from './ConversationsSelectFilter';
import type { PlainText } from '../text/PlainText';

/** Picks several conversations the user belongs to: channels, private groups or direct messages. Its value is the list of room ids. */
export type MultiConversationsSelectElement = Actionable<{
	type: 'multi_conversations_select';
	placeholder?: PlainText;
	/** Ids of the rooms selected when the view opens. */
	initial_conversations?: string[];
	/** Most conversations that can be selected. */
	max_selected_items?: number;
	/** Starts with the conversation the view was opened from when nothing else is selected. */
	default_to_current_conversation?: boolean;
	/** Which kinds of conversation to list; `im` and `mpim` both cover direct messages. */
	filter?: ConversationsSelectFilter;
	focus_on_load?: boolean;
}>;

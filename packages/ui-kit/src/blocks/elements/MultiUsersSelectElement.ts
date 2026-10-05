import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type MultiUsersSelectElement = Actionable<{
	type: 'multi_users_select';
	placeholder?: PlainText;
	/** Usernames of the users selected when the view opens. */
	initial_users?: string[];
	/** Most users that can be selected. */
	max_selected_items?: number;
}>;

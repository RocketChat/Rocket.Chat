import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type UsersSelectElement = Actionable<{
	type: 'users_select';
	placeholder?: PlainText;
	/** Username of the user selected when the view opens. */
	initial_user?: string;
	focus_on_load?: boolean;
}>;

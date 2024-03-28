import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type MultiUsersSelectElement = Actionable<{
	type: 'multi_users_select';
	placeholder?: PlainText;
}>;

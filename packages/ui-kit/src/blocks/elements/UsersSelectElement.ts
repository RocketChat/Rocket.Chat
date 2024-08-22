import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type UsersSelectElement = Actionable<{
	type: 'users_select';
	placeholder?: PlainText;
}>;

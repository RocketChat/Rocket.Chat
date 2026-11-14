import type { Actionable } from '../Actionable.js';
import type { Option } from '../Option.js';
import type { PlainText } from '../text/PlainText.js';

export type ExternalSelectElement = Actionable<{
	type: 'external_select';
	placeholder?: PlainText;
	/** Option selected when the view opens. */
	initial_option?: Option;
	/** Characters the user types before the app is asked for options. Defaults to 3. */
	min_query_length?: number;
	focus_on_load?: boolean;
}>;

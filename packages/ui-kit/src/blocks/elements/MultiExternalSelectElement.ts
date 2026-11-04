import type { Actionable } from '../Actionable';
import type { Option } from '../Option';
import type { PlainText } from '../text/PlainText';

export type MultiExternalSelectElement = Actionable<{
	type: 'multi_external_select';
	placeholder?: PlainText;
	/** Options selected when the view opens. */
	initial_options?: Option[];
	/** Characters the user types before the app is asked for options. Defaults to 3. */
	min_query_length?: number;
	/** Most options that can be selected. */
	max_selected_items?: number;
	focus_on_load?: boolean;
}>;

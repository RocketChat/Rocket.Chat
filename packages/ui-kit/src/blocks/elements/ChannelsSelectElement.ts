import type { Actionable } from '../Actionable.js';
import type { PlainText } from '../text/PlainText.js';

export type ChannelsSelectElement = Actionable<{
	type: 'channels_select';
	placeholder?: PlainText;
	/** Id of the room selected when the view opens. */
	initial_channel?: string;
	focus_on_load?: boolean;
}>;

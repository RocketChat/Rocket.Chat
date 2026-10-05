import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type ChannelsSelectElement = Actionable<{
	type: 'channels_select';
	placeholder?: PlainText;
	/** Id of the room selected when the view opens. */
	initial_channel?: string;
}>;

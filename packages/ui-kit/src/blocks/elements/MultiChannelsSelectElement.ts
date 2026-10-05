import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type MultiChannelsSelectElement = Actionable<{
	type: 'multi_channels_select';
	placeholder?: PlainText;
	/** Ids of the rooms selected when the view opens. */
	initial_channels?: string[];
}>;

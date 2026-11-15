import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type LinearScaleElement = Actionable<{
	type: 'linear_scale';
	minValue?: number;
	maxValue?: number; // TODO: The maximum length of the LinearScaleElement is not specified in the specification. We should set a reasonable value for it to prevent potential issues with very large numbers.
	initialValue?: number;
	preLabel?: PlainText;
	postLabel?: PlainText;
}>;

import type { Actionable } from '../Actionable';
import type { PlainText } from '../text/PlainText';

export type LinearScaleElement = Actionable<{
	type: 'linear_scale';
	minValue?: number;
	maxValue?: number;
	initialValue?: number;
	preLabel?: PlainText;
	postLabel?: PlainText;
}>;

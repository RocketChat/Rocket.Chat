import type { Actionable } from '../Actionable';
import type { TextObject } from '../TextObject';

export type DateTimePickerElement = Actionable<{
	type: 'datetimepicker';
	placeholder?: TextObject;
	initialDateTime?: string;
}>;

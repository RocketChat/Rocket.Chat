import type { Actionable } from '../Actionable';
import type { TextObject } from '../TextObject';

export type ExperimentalTabElement = Actionable<{
	type: 'tab';
	title: TextObject;
	disabled?: boolean;
	selected?: boolean;
}>;

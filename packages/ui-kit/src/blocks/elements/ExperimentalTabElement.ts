import type { Actionable } from '../Actionable.js';
import type { TextObject } from '../TextObject.js';

export type ExperimentalTabElement = Actionable<{
	type: 'tab';
	title: TextObject;
	disabled?: boolean;
	selected?: boolean;
}>;

import type { Actionable } from '../Actionable.js';
import type { Option } from '../Option.js';

export type OverflowElement = Actionable<{
	type: 'overflow';
	options: readonly Option[];
}>;

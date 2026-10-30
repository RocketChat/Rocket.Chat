import type { Actionable } from '../Actionable.js';
import type { IconElement } from './IconElement.js';

export type IconButtonElement = Actionable<{
	type: 'icon_button';
	icon: IconElement;
	label?: string;
	url?: string;
	value?: string;
}>;

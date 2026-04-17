import type { Actionable } from '../Actionable';
import type { IconElement } from './IconElement';

export type IconButtonElement = Actionable<{
	type: 'icon_button';
	icon: IconElement;
	label?: string;
	url?: string;
	value?: string;
}>;

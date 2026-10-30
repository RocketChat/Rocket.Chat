import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { TextObject } from '../TextObject.js';
import type { ButtonElement } from '../elements/ButtonElement.js';
import type { OverflowElement } from '../elements/OverflowElement.js';

export type CalloutBlock = LayoutBlockish<{
	type: 'callout';
	title?: TextObject;
	text: TextObject;
	variant?: 'info' | 'danger' | 'warning' | 'success';
	accessory?: ButtonElement | OverflowElement;
}>;

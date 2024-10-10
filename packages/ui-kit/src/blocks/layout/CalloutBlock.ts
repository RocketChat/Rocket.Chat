import type { LayoutBlockish } from '../LayoutBlockish';
import type { TextObject } from '../TextObject';
import type { ButtonElement } from '../elements/ButtonElement';
import type { OverflowElement } from '../elements/OverflowElement';

export type CalloutBlock = LayoutBlockish<{
	type: 'callout';
	title?: TextObject;
	text: TextObject;
	variant?: 'info' | 'danger' | 'warning' | 'success';
	accessory?: ButtonElement | OverflowElement;
}>;

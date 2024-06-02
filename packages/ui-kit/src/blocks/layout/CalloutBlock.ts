import type { LayoutBlockish } from '../LayoutBlockish';
import type { TextObject } from '../TextObject';

export type CalloutBlock = LayoutBlockish<{
	type: 'callout';
	title?: TextObject;
	text: TextObject;
	variant?: 'info' | 'danger' | 'warning' | 'success';
}>;

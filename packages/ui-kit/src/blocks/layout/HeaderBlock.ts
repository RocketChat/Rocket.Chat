import type { LayoutBlockish } from '../LayoutBlockish';
import type { PlainText } from '../text/PlainText';

export type HeaderBlock = LayoutBlockish<{
	type: 'header';
	text: PlainText;
}>;

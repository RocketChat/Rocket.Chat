import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { IconButtonElement } from '../elements/IconButtonElement.js';
import type { FrameableIconElement } from '../elements/IconElement.js';
import type { Markdown } from '../text/Markdown.js';
import type { PlainText } from '../text/PlainText.js';

type InfoCardRow = {
	background: 'default' | 'secondary';
	elements: readonly (FrameableIconElement | PlainText | Markdown)[];
	action?: IconButtonElement;
};

export type InfoCardBlock = LayoutBlockish<{
	type: 'info_card';
	rows: readonly InfoCardRow[];
}>;

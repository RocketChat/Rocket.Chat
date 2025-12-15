import type { LayoutBlockType } from '../LayoutBlockType';
import type { LayoutBlockish } from '../LayoutBlockish';
import type { IconButtonElement } from '../elements/IconButtonElement';
import type { FrameableIconElement } from '../elements/IconElement';
import type { Markdown } from '../text/Markdown';
import type { PlainText } from '../text/PlainText';

type InfoCardRow = {
	background: 'default' | 'secondary';
	elements: readonly (FrameableIconElement | PlainText | Markdown)[];
	action?: IconButtonElement;
};

export type InfoCardBlock = LayoutBlockish<{
	type: `${LayoutBlockType.INFO_CARD}`;
	rows: readonly InfoCardRow[];
}>;

import type { LayoutBlockType } from '../LayoutBlockType';
import type { LayoutBlockish } from '../LayoutBlockish';
import type { IconButtonElement } from '../elements/IconButtonElement';
import type { IconElement } from '../elements/IconElement';
import type { PlainText } from '../text/PlainText';

type PreviewSection = {
	variant: 'foreground' | 'background';
	elements: readonly (IconElement | PlainText)[];
	action?: IconButtonElement;
};

export type SectionedPreviewBlock = LayoutBlockish<{
	type: `${LayoutBlockType.SECTIONED_PREVIEW}`;
	sections: readonly PreviewSection[];
}>;

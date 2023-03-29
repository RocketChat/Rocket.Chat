import type { LayoutBlockish } from '../LayoutBlockish';
import type { TextObject } from '../TextObject';
import type { ButtonElement } from '../elements/ButtonElement';
import type { DatePickerElement } from '../elements/DatePickerElement';
import type { ImageElement } from '../elements/ImageElement';
import type { MultiStaticSelectElement } from '../elements/MultiStaticSelectElement';
import type { OverflowElement } from '../elements/OverflowElement';
import type { StaticSelectElement } from '../elements/StaticSelectElement';

export type SectionBlock = LayoutBlockish<{
	type: 'section';
	text?: TextObject;
	fields?: readonly TextObject[];
	accessory?: ButtonElement | DatePickerElement | ImageElement | MultiStaticSelectElement | OverflowElement | StaticSelectElement;
}>;

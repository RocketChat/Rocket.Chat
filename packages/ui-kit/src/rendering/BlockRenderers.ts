import type { BlockElement } from '../blocks/BlockElement';
import type { RenderableLayoutBlock } from '../blocks/RenderableLayoutBlock';
import type { TextObject } from '../blocks/TextObject';
import type { DatePickerElement } from '../blocks/elements/DatePickerElement';
import type { LinearScaleElement } from '../blocks/elements/LinearScaleElement';
import type { MultiStaticSelectElement } from '../blocks/elements/MultiStaticSelectElement';
import type { PlainTextInputElement } from '../blocks/elements/PlainTextInputElement';
import type { StaticSelectElement } from '../blocks/elements/StaticSelectElement';
import type { PlainText } from '../blocks/text/PlainText';
import type { BlockElementRenderer } from './BlockElementRenderer';
import type { LayoutBlockRenderer } from './LayoutBlockRenderer';
import type { TextObjectRenderer } from './TextObjectRenderer';

export type BlockRenderers<T> = {
	[B in RenderableLayoutBlock as B['type']]?: LayoutBlockRenderer<T, B>;
} & {
	[B in TextObject as B['type']]: TextObjectRenderer<T, B>;
} & {
	[B in BlockElement as B['type']]?: BlockElementRenderer<T, B>;
} & {
	/** @deprecated */
	plainText?: TextObjectRenderer<T, PlainText>;

	/** @deprecated */
	text?: TextObjectRenderer<T>;

	/** @deprecated */
	datePicker?: BlockElementRenderer<T, DatePickerElement>;

	/** @deprecated */
	staticSelect?: BlockElementRenderer<T, StaticSelectElement>;

	/** @deprecated */
	multiStaticSelect?: BlockElementRenderer<T, MultiStaticSelectElement>;

	/** @deprecated */
	plainInput?: BlockElementRenderer<T, PlainTextInputElement>;

	/** @deprecated */
	linearScale?: BlockElementRenderer<T, LinearScaleElement>;
};

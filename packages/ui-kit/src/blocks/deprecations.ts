/* eslint-disable @typescript-eslint/no-empty-interface */
import type { LayoutBlock } from '..';
import type { Actionable } from './Actionable';
import type { Block } from './Block';
import type { Option } from './Option';
import type { TextObject } from './TextObject';
import type { ButtonElement } from './elements/ButtonElement';
import type { DatePickerElement } from './elements/DatePickerElement';
import type { ImageElement } from './elements/ImageElement';
import type { LinearScaleElement } from './elements/LinearScaleElement';
import type { MultiStaticSelectElement } from './elements/MultiStaticSelectElement';
import type { OverflowElement } from './elements/OverflowElement';
import type { PlainTextInputElement } from './elements/PlainTextInputElement';
import type { StaticSelectElement } from './elements/StaticSelectElement';
import type { ActionsBlock } from './layout/ActionsBlock';
import type { ConditionalBlock } from './layout/ConditionalBlock';
import type { ContextBlock } from './layout/ContextBlock';
import type { DividerBlock } from './layout/DividerBlock';
import type { ImageBlock } from './layout/ImageBlock';
import type { InputBlock } from './layout/InputBlock';
import type { SectionBlock } from './layout/SectionBlock';
import type { Markdown } from './text/Markdown';
import type { PlainText } from './text/PlainText';

type InterfaceOf<T> = Pick<T, keyof T>;

/** @deprecated */
export type ILinearScaleElement = InterfaceOf<LinearScaleElement>;
/** @deprecated */
export type IPlainTextInput = InterfaceOf<PlainTextInputElement>;
/** @deprecated */
export type IStaticSelectElement = InterfaceOf<StaticSelectElement>;
/** @deprecated */
export type IMultiStaticSelectElement = InterfaceOf<MultiStaticSelectElement>;
/** @deprecated */
export type IDatePickerElement = InterfaceOf<DatePickerElement>;
/** @deprecated */
export type IButtonElement = InterfaceOf<ButtonElement>;
/** @deprecated */
export type IOverflowElement = InterfaceOf<OverflowElement>;
/** @deprecated */
export type IImageElement = InterfaceOf<ImageElement>;
/** @deprecated */
export type IActionableElement = InterfaceOf<Actionable<Record<never, never>>>;

/** @deprecated */
export type IActionsBlock = InterfaceOf<ActionsBlock>;
/** @deprecated */
export type ActionElement = InterfaceOf<ActionsBlock['elements'][number]>;
/** @deprecated */
export type ISectionBlock = InterfaceOf<SectionBlock>;
/** @deprecated */
export type SectionAccessoryElement = InterfaceOf<Exclude<SectionBlock['accessory'], undefined>>;
/** @deprecated */
export type AccessoryElements = InterfaceOf<Exclude<SectionBlock['accessory'], undefined>>;
/** @deprecated */
export type IImageBlock = InterfaceOf<ImageBlock>;
/** @deprecated */
export type IDividerBlock = InterfaceOf<DividerBlock>;
/** @deprecated */
export type IInputBlock = InterfaceOf<InputBlock>;
/** @deprecated */
export type InputElement = InterfaceOf<InputBlock['element']>;
/** @deprecated */
export type IContextBlock = InterfaceOf<ContextBlock>;
/** @deprecated */
export type ContextElement = InterfaceOf<ContextBlock['elements'][number]>;
/** @deprecated */
export type IConditionalBlock = InterfaceOf<ConditionalBlock>;
/** @deprecated */
export type ConditionalBlockFilters = InterfaceOf<Exclude<ConditionalBlock['when'], undefined>>;
/** @deprecated */
export type IConditionalBlockFilters = InterfaceOf<ConditionalBlock['when']>;
/** @deprecated */
export type IBlock = InterfaceOf<LayoutBlock>;

/** @deprecated */
export type IPlainText = InterfaceOf<PlainText>;
/** @deprecated */
export type IMarkdown = InterfaceOf<Markdown>;

/** @deprecated */
export type IElement = InterfaceOf<Block>;

/** @deprecated */
export type ITextObject = InterfaceOf<TextObject & { emoji?: boolean }>;

/** @deprecated */
export type IOptionObject = InterfaceOf<Omit<Option, 'description' | 'url'>>;

/** @deprecated */
export type IBlockElement = Pick<Block, 'type'>;

/** @deprecated */
export type IInteractiveElement = InterfaceOf<
	IBlockElement & {
		actionId: string;
	}
>;

/** @deprecated */
export type IInputElement = InterfaceOf<
	IBlockElement & {
		actionId: string;
		placeholder: ITextObject;
		initialValue?: string | string[];
	}
>;

export type IOverflowMenuElement = InterfaceOf<
	IInteractiveElement & {
		type: OverflowElement['type'];
		options: IOptionObject[];
	}
>;

export type IPlainTextInputElement = InterfaceOf<IInputElement & PlainTextInputElement>;

export type ISelectElement = InterfaceOf<
	IInputElement & {
		type: StaticSelectElement['type'] | MultiStaticSelectElement['type'];
	}
>;

export {
	/** @deprecated */
	ButtonStyle,
} from './ButtonStyle';
export {
	/** @deprecated */
	ConditionalBlockFiltersEngine,
} from '../rendering/ConditionalBlockFiltersEngine';
export {
	/** @deprecated */
	LayoutBlockType as BlockType,
} from './LayoutBlockType';

export {
	ElementType,
	/** @deprecated */
	ElementType as ELEMENT_TYPES,
} from './ElementType';

export {
	/** @deprecated */
	BlockContext as BLOCK_CONTEXT,
} from '../rendering/BlockContext';

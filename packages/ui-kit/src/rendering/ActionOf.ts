import type { ActionableElement } from '../blocks/ActionableElement';
import type { Option } from '../blocks/Option';
import type { ButtonElement } from '../blocks/elements/ButtonElement';
import type { ChannelsSelectElement } from '../blocks/elements/ChannelsSelectElement';
import type { CheckboxElement } from '../blocks/elements/CheckboxElement';
import type { ConversationsSelectElement } from '../blocks/elements/ConversationsSelectElement';
import type { DatePickerElement } from '../blocks/elements/DatePickerElement';
import type { LinearScaleElement } from '../blocks/elements/LinearScaleElement';
import type { MultiChannelsSelectElement } from '../blocks/elements/MultiChannelsSelectElement';
import type { MultiConversationsSelectElement } from '../blocks/elements/MultiConversationsSelectElement';
import type { MultiStaticSelectElement } from '../blocks/elements/MultiStaticSelectElement';
import type { MultiUsersSelectElement } from '../blocks/elements/MultiUsersSelectElement';
import type { OverflowElement } from '../blocks/elements/OverflowElement';
import type { PlainTextInputElement } from '../blocks/elements/PlainTextInputElement';
import type { RadioButtonElement } from '../blocks/elements/RadioButtonElement';
import type { StaticSelectElement } from '../blocks/elements/StaticSelectElement';
import type { TimePickerElement } from '../blocks/elements/TimePickerElement';
import type { ToggleSwitchElement } from '../blocks/elements/ToggleSwitchElement';
import type { UsersSelectElement } from '../blocks/elements/UsersSelectElement';

export type ActionOf<TElement extends ActionableElement> = TElement extends ButtonElement
	? ButtonElement['value']
	: TElement extends ChannelsSelectElement
	? Option['value']
	: TElement extends ConversationsSelectElement
	? unknown
	: TElement extends DatePickerElement
	? DatePickerElement['initialDate']
	: TElement extends LinearScaleElement
	? LinearScaleElement['initialValue']
	: TElement extends MultiChannelsSelectElement
	? Option['value'][]
	: TElement extends MultiConversationsSelectElement
	? unknown
	: TElement extends MultiStaticSelectElement
	? MultiStaticSelectElement['initialValue']
	: TElement extends MultiUsersSelectElement
	? unknown
	: TElement extends OverflowElement
	? OverflowElement['options'][number]['value']
	: TElement extends PlainTextInputElement
	? PlainTextInputElement['initialValue']
	: TElement extends StaticSelectElement
	? StaticSelectElement['initialValue']
	: TElement extends UsersSelectElement
	? unknown
	: TElement extends ToggleSwitchElement
	? Option['value'][]
	: TElement extends RadioButtonElement
	? Option['value'] | undefined
	: TElement extends CheckboxElement
	? Option['value'][] | undefined
	: TElement extends TimePickerElement
	? TimePickerElement['initialTime']
	: never;

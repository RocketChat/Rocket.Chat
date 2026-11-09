import type { LayoutBlockish } from '../LayoutBlockish';
import type { TextObject } from '../TextObject';
import type { ButtonElement } from '../elements/ButtonElement';
import type { ChannelsSelectElement } from '../elements/ChannelsSelectElement';
import type { CheckboxElement } from '../elements/CheckboxElement';
import type { ConversationsSelectElement } from '../elements/ConversationsSelectElement';
import type { DatePickerElement } from '../elements/DatePickerElement';
import type { ImageElement } from '../elements/ImageElement';
import type { MultiChannelsSelectElement } from '../elements/MultiChannelsSelectElement';
import type { MultiConversationsSelectElement } from '../elements/MultiConversationsSelectElement';
import type { MultiStaticSelectElement } from '../elements/MultiStaticSelectElement';
import type { MultiUsersSelectElement } from '../elements/MultiUsersSelectElement';
import type { OverflowElement } from '../elements/OverflowElement';
import type { RadioButtonElement } from '../elements/RadioButtonElement';
import type { StaticSelectElement } from '../elements/StaticSelectElement';
import type { TimePickerElement } from '../elements/TimePickerElement';
import type { UsersSelectElement } from '../elements/UsersSelectElement';

export type SectionBlock = LayoutBlockish<{
	type: 'section';
	text?: TextObject;
	fields?: readonly TextObject[];
	accessory?:
		| ButtonElement
		| ChannelsSelectElement
		| CheckboxElement
		| ConversationsSelectElement
		| DatePickerElement
		| ImageElement
		| MultiChannelsSelectElement
		| MultiConversationsSelectElement
		| MultiStaticSelectElement
		| MultiUsersSelectElement
		| OverflowElement
		| RadioButtonElement
		| StaticSelectElement
		| TimePickerElement
		| UsersSelectElement;
}>;

import type { LayoutBlockish } from '../LayoutBlockish';
import type { ChannelsSelectElement } from '../elements/ChannelsSelectElement';
import type { CheckboxElement } from '../elements/CheckboxElement';
import type { ConversationsSelectElement } from '../elements/ConversationsSelectElement';
import type { DatePickerElement } from '../elements/DatePickerElement';
import type { LinearScaleElement } from '../elements/LinearScaleElement';
import type { MultiChannelsSelectElement } from '../elements/MultiChannelsSelectElement';
import type { MultiConversationsSelectElement } from '../elements/MultiConversationsSelectElement';
import type { MultiStaticSelectElement } from '../elements/MultiStaticSelectElement';
import type { MultiUsersSelectElement } from '../elements/MultiUsersSelectElement';
import type { PlainTextInputElement } from '../elements/PlainTextInputElement';
import type { RadioButtonElement } from '../elements/RadioButtonElement';
import type { StaticSelectElement } from '../elements/StaticSelectElement';
import type { TimePickerElement } from '../elements/TimePickerElement';
import type { ToggleSwitchElement } from '../elements/ToggleSwitchElement';
import type { UsersSelectElement } from '../elements/UsersSelectElement';
import type { PlainText } from '../text/PlainText';

export type InputBlock = LayoutBlockish<{
	type: 'input';
	label: PlainText;
	element:
		| ChannelsSelectElement
		| ConversationsSelectElement
		| DatePickerElement
		| LinearScaleElement
		| MultiChannelsSelectElement
		| MultiConversationsSelectElement
		| MultiStaticSelectElement
		| MultiUsersSelectElement
		| PlainTextInputElement
		| StaticSelectElement
		| UsersSelectElement
		| CheckboxElement
		| RadioButtonElement
		| TimePickerElement
		| ToggleSwitchElement;
	hint?: PlainText;
	optional?: boolean;
}>;

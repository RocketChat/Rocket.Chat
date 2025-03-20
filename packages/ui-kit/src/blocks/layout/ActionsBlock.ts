import type { LayoutBlockish } from '../LayoutBlockish';
import type { ButtonElement } from '../elements/ButtonElement';
import type { ChannelsSelectElement } from '../elements/ChannelsSelectElement';
import type { CheckboxElement } from '../elements/CheckboxElement';
import type { ConversationsSelectElement } from '../elements/ConversationsSelectElement';
import type { DatePickerElement } from '../elements/DatePickerElement';
import type { LinearScaleElement } from '../elements/LinearScaleElement';
import type { MultiChannelsSelectElement } from '../elements/MultiChannelsSelectElement';
import type { MultiConversationsSelectElement } from '../elements/MultiConversationsSelectElement';
import type { MultiStaticSelectElement } from '../elements/MultiStaticSelectElement';
import type { MultiUsersSelectElement } from '../elements/MultiUsersSelectElement';
import type { OverflowElement } from '../elements/OverflowElement';
import type { RadioButtonElement } from '../elements/RadioButtonElement';
import type { StaticSelectElement } from '../elements/StaticSelectElement';
import type { TimePickerElement } from '../elements/TimePickerElement';
import type { ToggleSwitchElement } from '../elements/ToggleSwitchElement';
import type { UsersSelectElement } from '../elements/UsersSelectElement';

export type ActionsBlock = LayoutBlockish<{
	type: 'actions';
	elements: readonly (
		| ButtonElement
		| ChannelsSelectElement
		| ConversationsSelectElement
		| DatePickerElement
		| LinearScaleElement
		| MultiChannelsSelectElement
		| MultiConversationsSelectElement
		| MultiStaticSelectElement
		| MultiUsersSelectElement
		| OverflowElement
		| StaticSelectElement
		| UsersSelectElement
		| ToggleSwitchElement
		| CheckboxElement
		| RadioButtonElement
		| TimePickerElement
	)[];
}>;

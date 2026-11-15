import type { LayoutBlockish } from '../LayoutBlockish.js';
import type { ButtonElement } from '../elements/ButtonElement.js';
import type { ChannelsSelectElement } from '../elements/ChannelsSelectElement.js';
import type { CheckboxElement } from '../elements/CheckboxElement.js';
import type { ConversationsSelectElement } from '../elements/ConversationsSelectElement.js';
import type { DatePickerElement } from '../elements/DatePickerElement.js';
import type { DateTimePickerElement } from '../elements/DateTimePickerElement.js';
import type { LinearScaleElement } from '../elements/LinearScaleElement.js';
import type { MultiChannelsSelectElement } from '../elements/MultiChannelsSelectElement.js';
import type { MultiConversationsSelectElement } from '../elements/MultiConversationsSelectElement.js';
import type { MultiStaticSelectElement } from '../elements/MultiStaticSelectElement.js';
import type { MultiUsersSelectElement } from '../elements/MultiUsersSelectElement.js';
import type { OverflowElement } from '../elements/OverflowElement.js';
import type { RadioButtonElement } from '../elements/RadioButtonElement.js';
import type { StaticSelectElement } from '../elements/StaticSelectElement.js';
import type { TimePickerElement } from '../elements/TimePickerElement.js';
import type { ToggleSwitchElement } from '../elements/ToggleSwitchElement.js';
import type { UsersSelectElement } from '../elements/UsersSelectElement.js';

export type ActionsBlock = LayoutBlockish<{
	type: 'actions';
	elements: readonly (
		| ButtonElement
		| ChannelsSelectElement
		| ConversationsSelectElement
		| DatePickerElement
		| DateTimePickerElement
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

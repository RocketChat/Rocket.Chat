import type { ButtonElement } from './elements/ButtonElement.js';
import type { ChannelsSelectElement } from './elements/ChannelsSelectElement.js';
import type { CheckboxElement } from './elements/CheckboxElement.js';
import type { ConversationsSelectElement } from './elements/ConversationsSelectElement.js';
import type { DatePickerElement } from './elements/DatePickerElement.js';
import type { DateTimePickerElement } from './elements/DateTimePickerElement.js';
import type { EmailTextInputElement } from './elements/EmailTextInputElement.js';
import type { ExperimentalTabElement } from './elements/ExperimentalTabElement.js';
import type { FeedbackButtonsElement } from './elements/FeedbackButtonsElement.js';
import type { IconButtonElement } from './elements/IconButtonElement.js';
import type { FrameableIconElement } from './elements/IconElement.js';
import type { ImageElement } from './elements/ImageElement.js';
import type { LinearScaleElement } from './elements/LinearScaleElement.js';
import type { MultiChannelsSelectElement } from './elements/MultiChannelsSelectElement.js';
import type { MultiConversationsSelectElement } from './elements/MultiConversationsSelectElement.js';
import type { MultiStaticSelectElement } from './elements/MultiStaticSelectElement.js';
import type { MultiUsersSelectElement } from './elements/MultiUsersSelectElement.js';
import type { NumberInputElement } from './elements/NumberInputElement.js';
import type { OverflowElement } from './elements/OverflowElement.js';
import type { PlainTextInputElement } from './elements/PlainTextInputElement.js';
import type { RadioButtonElement } from './elements/RadioButtonElement.js';
import type { StaticSelectElement } from './elements/StaticSelectElement.js';
import type { TimePickerElement } from './elements/TimePickerElement.js';
import type { ToggleSwitchElement } from './elements/ToggleSwitchElement.js';
import type { UrlTextInputElement } from './elements/UrlTextInputElement.js';
import type { UsersSelectElement } from './elements/UsersSelectElement.js';

export type BlockElement =
	| ButtonElement
	| ChannelsSelectElement
	| ConversationsSelectElement
	| DatePickerElement
	| DateTimePickerElement
	| ImageElement
	| LinearScaleElement
	| MultiChannelsSelectElement
	| MultiConversationsSelectElement
	| MultiStaticSelectElement
	| MultiUsersSelectElement
	| OverflowElement
	| PlainTextInputElement
	| NumberInputElement
	| EmailTextInputElement
	| UrlTextInputElement
	| StaticSelectElement
	| UsersSelectElement
	| ToggleSwitchElement
	| RadioButtonElement
	| CheckboxElement
	| TimePickerElement
	| ExperimentalTabElement
	| FeedbackButtonsElement
	| FrameableIconElement
	| IconButtonElement;

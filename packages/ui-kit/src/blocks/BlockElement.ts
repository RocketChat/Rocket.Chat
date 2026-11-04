import type { ButtonElement } from './elements/ButtonElement';
import type { ChannelsSelectElement } from './elements/ChannelsSelectElement';
import type { CheckboxElement } from './elements/CheckboxElement';
import type { ConversationsSelectElement } from './elements/ConversationsSelectElement';
import type { DatePickerElement } from './elements/DatePickerElement';
import type { DateTimePickerElement } from './elements/DateTimePickerElement';
import type { EmailTextInputElement } from './elements/EmailTextInputElement';
import type { ExperimentalTabElement } from './elements/ExperimentalTabElement';
import type { ExternalSelectElement } from './elements/ExternalSelectElement';
import type { FeedbackButtonsElement } from './elements/FeedbackButtonsElement';
import type { FileInputElement } from './elements/FileInputElement';
import type { IconButtonElement } from './elements/IconButtonElement';
import type { FrameableIconElement } from './elements/IconElement';
import type { ImageElement } from './elements/ImageElement';
import type { LinearScaleElement } from './elements/LinearScaleElement';
import type { MultiChannelsSelectElement } from './elements/MultiChannelsSelectElement';
import type { MultiConversationsSelectElement } from './elements/MultiConversationsSelectElement';
import type { MultiExternalSelectElement } from './elements/MultiExternalSelectElement';
import type { MultiStaticSelectElement } from './elements/MultiStaticSelectElement';
import type { MultiUsersSelectElement } from './elements/MultiUsersSelectElement';
import type { NumberInputElement } from './elements/NumberInputElement';
import type { OverflowElement } from './elements/OverflowElement';
import type { PlainTextInputElement } from './elements/PlainTextInputElement';
import type { RadioButtonElement } from './elements/RadioButtonElement';
import type { RichTextInputElement } from './elements/RichTextInputElement';
import type { StaticSelectElement } from './elements/StaticSelectElement';
import type { TimePickerElement } from './elements/TimePickerElement';
import type { ToggleSwitchElement } from './elements/ToggleSwitchElement';
import type { UrlTextInputElement } from './elements/UrlTextInputElement';
import type { UsersSelectElement } from './elements/UsersSelectElement';

export type BlockElement =
	| ButtonElement
	| ChannelsSelectElement
	| ConversationsSelectElement
	| DatePickerElement
	| DateTimePickerElement
	| ImageElement
	| ExternalSelectElement
	| LinearScaleElement
	| MultiChannelsSelectElement
	| MultiConversationsSelectElement
	| MultiExternalSelectElement
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
	| RichTextInputElement
	| CheckboxElement
	| TimePickerElement
	| ExperimentalTabElement
	| FeedbackButtonsElement
	| FileInputElement
	| FrameableIconElement
	| IconButtonElement;

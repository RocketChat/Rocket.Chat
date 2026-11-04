import type { LayoutBlockish } from '../LayoutBlockish';
import type { ChannelsSelectElement } from '../elements/ChannelsSelectElement';
import type { CheckboxElement } from '../elements/CheckboxElement';
import type { ConversationsSelectElement } from '../elements/ConversationsSelectElement';
import type { DatePickerElement } from '../elements/DatePickerElement';
import type { DateTimePickerElement } from '../elements/DateTimePickerElement';
import type { EmailTextInputElement } from '../elements/EmailTextInputElement';
import type { ExternalSelectElement } from '../elements/ExternalSelectElement';
import type { FileInputElement } from '../elements/FileInputElement';
import type { LinearScaleElement } from '../elements/LinearScaleElement';
import type { MultiChannelsSelectElement } from '../elements/MultiChannelsSelectElement';
import type { MultiConversationsSelectElement } from '../elements/MultiConversationsSelectElement';
import type { MultiExternalSelectElement } from '../elements/MultiExternalSelectElement';
import type { MultiStaticSelectElement } from '../elements/MultiStaticSelectElement';
import type { MultiUsersSelectElement } from '../elements/MultiUsersSelectElement';
import type { NumberInputElement } from '../elements/NumberInputElement';
import type { PlainTextInputElement } from '../elements/PlainTextInputElement';
import type { RadioButtonElement } from '../elements/RadioButtonElement';
import type { RichTextInputElement } from '../elements/RichTextInputElement';
import type { StaticSelectElement } from '../elements/StaticSelectElement';
import type { TimePickerElement } from '../elements/TimePickerElement';
import type { ToggleSwitchElement } from '../elements/ToggleSwitchElement';
import type { UrlTextInputElement } from '../elements/UrlTextInputElement';
import type { UsersSelectElement } from '../elements/UsersSelectElement';
import type { PlainText } from '../text/PlainText';

export type InputBlock = LayoutBlockish<{
	type: 'input';
	label: PlainText;
	element:
		| ChannelsSelectElement
		| ConversationsSelectElement
		| DatePickerElement
		| DateTimePickerElement
		| ExternalSelectElement
		| FileInputElement
		| LinearScaleElement
		| MultiChannelsSelectElement
		| MultiConversationsSelectElement
		| MultiExternalSelectElement
		| MultiStaticSelectElement
		| MultiUsersSelectElement
		| PlainTextInputElement
		| NumberInputElement
		| EmailTextInputElement
		| UrlTextInputElement
		| StaticSelectElement
		| UsersSelectElement
		| CheckboxElement
		| RadioButtonElement
		| RichTextInputElement
		| TimePickerElement
		| ToggleSwitchElement;
	hint?: PlainText;
	optional?: boolean;
}>;

import type { LayoutBlockish } from '../LayoutBlockish';
import type { ChannelsSelectElement } from '../elements/ChannelsSelectElement';
import type { ConversationsSelectElement } from '../elements/ConversationsSelectElement';
import type { DatePickerElement } from '../elements/DatePickerElement';
import type { LinearScaleElement } from '../elements/LinearScaleElement';
import type { MultiChannelsSelectElement } from '../elements/MultiChannelsSelectElement';
import type { MultiConversationsSelectElement } from '../elements/MultiConversationsSelectElement';
import type { MultiStaticSelectElement } from '../elements/MultiStaticSelectElement';
import type { MultiUsersSelectElement } from '../elements/MultiUsersSelectElement';
import type { PlainTextInputElement } from '../elements/PlainTextInputElement';
import type { StaticSelectElement } from '../elements/StaticSelectElement';
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
		| UsersSelectElement;
	hint?: PlainText;
	optional?: boolean;
}>;

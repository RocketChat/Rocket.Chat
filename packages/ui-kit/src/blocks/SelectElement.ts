import type { ChannelsSelectElement } from './elements/ChannelsSelectElement';
import type { ConversationsSelectElement } from './elements/ConversationsSelectElement';
import type { MultiChannelsSelectElement } from './elements/MultiChannelsSelectElement';
import type { MultiConversationsSelectElement } from './elements/MultiConversationsSelectElement';
import type { MultiStaticSelectElement } from './elements/MultiStaticSelectElement';
import type { MultiUsersSelectElement } from './elements/MultiUsersSelectElement';
import type { StaticSelectElement } from './elements/StaticSelectElement';
import type { UsersSelectElement } from './elements/UsersSelectElement';

export type SelectElement =
	| ChannelsSelectElement
	| ConversationsSelectElement
	| MultiChannelsSelectElement
	| MultiConversationsSelectElement
	| MultiStaticSelectElement
	| MultiUsersSelectElement
	| StaticSelectElement
	| UsersSelectElement;

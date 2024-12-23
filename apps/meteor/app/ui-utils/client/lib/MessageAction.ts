import type { Keys as IconName } from '@rocket.chat/icons';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

type MessageActionGroup = 'menu';

export type MessageActionContext =
	| 'message'
	| 'threads'
	| 'message-mobile'
	| 'pinned'
	| 'direct'
	| 'starred'
	| 'mentions'
	| 'federated'
	| 'videoconf'
	| 'search'
	| 'videoconf-threads';

type MessageActionType = 'communication' | 'interaction' | 'duplication' | 'apps' | 'management';

export type MessageActionConfig = {
	id: string;
	icon: IconName;
	variant?: 'danger' | 'success' | 'warning';
	label: TranslationKey;
	order: number;
	/** @deprecated */
	color?: 'alert';
	group: MessageActionGroup;
	context?: MessageActionContext[];
	action: (e: Pick<Event, 'preventDefault' | 'stopPropagation' | 'currentTarget'> | undefined) => any;
	type?: MessageActionType;
	disabled?: boolean;
};

import type { Keys as IconName } from '@rocket.chat/icons';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

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

export type MessageActionType = 'communication' | 'interaction' | 'duplication' | 'apps' | 'management';

export type MessageActionConfig = {
	id: string;
	icon: IconName;
	variant?: 'danger' | 'success' | 'warning';
	label: TranslationKey;
	tooltip?: string;
	order: number;
	group: 'menu';
	context?: MessageActionContext[];
	action: (event: Pick<Event, 'preventDefault' | 'stopPropagation' | 'currentTarget'> | undefined) => unknown;
	type?: MessageActionType;
	disabled?: boolean;
};

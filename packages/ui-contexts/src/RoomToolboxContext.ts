import type { Box } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { createContext } from 'react';
import type { ReactNode, ComponentProps, ComponentType } from 'react';

import type { TranslationKey } from './TranslationContext';

export type RenderToolboxItemParams = RoomToolboxActionConfig & {
	className?: ComponentProps<typeof Box>['className'];
	toolbox: RoomToolboxContextValue;
};

export type RoomToolboxActionConfig = {
	id: string;
	icon: IconName;
	title: TranslationKey;
	anonymous?: boolean;
	tooltip?: string;
	disabled?: boolean;
	full?: true;
	order?: number;
	groups: Array<'group' | 'channel' | 'live' | 'direct' | 'direct_multiple' | 'team'>;
	hotkey?: string;
	action?: () => void;
	featured?: boolean;
	renderToolboxItem?: (params: RenderToolboxItemParams) => ReactNode;
	tabComponent?: ComponentType<{
		onClickBack?: () => void;
	}>;
	type?: 'organization' | 'communication' | 'customization' | 'apps';
	variant?: 'danger';
};

export type RoomToolboxContextValue = {
	actions: RoomToolboxActionConfig[];
	tab?: RoomToolboxActionConfig;
	context?: string;
	openTab: (actionId: string, context?: string) => void;
	closeTab: () => void;
};

export const RoomToolboxContext = createContext<RoomToolboxContextValue>({
	actions: [],
	openTab: () => undefined,
	closeTab: () => undefined,
});

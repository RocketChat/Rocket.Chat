import type { Box } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { createContext, useContext } from 'react';
import type { ReactNode, ComponentProps, ComponentType, UIEvent } from 'react';

export type RenderToolboxItemParams = RoomToolboxActionConfig & {
	className?: ComponentProps<typeof Box>['className'];
	index: number;
	toolbox: RoomToolboxContextValue;
};

export type RoomToolboxActionConfig = {
	id: string;
	icon?: IconName;
	title: TranslationKey;
	anonymous?: boolean;
	tooltip?: string;
	disabled?: boolean;
	full?: true;
	order?: number;
	groups: Array<'group' | 'channel' | 'live' | 'direct' | 'direct_multiple' | 'team' | 'voip'>;
	hotkey?: string;
	action?: (event?: UIEvent<HTMLElement>) => void;
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

export const useRoomToolbox = () => useContext(RoomToolboxContext);

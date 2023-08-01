import type { IRoom } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { createContext, useContext } from 'react';
import type { ReactNode, MouseEvent, ComponentProps, ComponentType } from 'react';

type RenderToolboxItemParams = ToolboxActionConfig & {
	className?: ComponentProps<typeof Box>['className'];
	index: number;
	toolbox: RoomToolboxContextValue;
};

export type ToolboxActionConfig = {
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
	action?: (e?: MouseEvent<HTMLElement>) => void;
	template?: ComponentType<{
		_id: IRoom['_id'];
		rid: IRoom['_id'];
		teamId: IRoom['teamId'];
	}>;
	featured?: boolean;
	renderToolboxItem?: (params: RenderToolboxItemParams) => ReactNode;
};

export type RoomToolboxContextValue = {
	actions: ToolboxActionConfig[];
	tab?: ToolboxActionConfig;
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

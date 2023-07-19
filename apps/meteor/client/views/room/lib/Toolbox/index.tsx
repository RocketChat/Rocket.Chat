import type { IRoom } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactNode, MouseEvent, ComponentProps, ComponentType } from 'react';

import type { ToolboxContextValue } from '../../contexts/ToolboxContext';

type ActionRendererProps = Omit<ToolboxAction, 'renderAction' | 'groups' | 'title'> & {
	className?: ComponentProps<typeof Box>['className'];
	index: number;
	title: string;
};

export type ToolboxAction = {
	id: string;
	icon?: IconName;
	title: TranslationKey;
	anonymous?: boolean;
	tooltip?: string;
	disabled?: boolean;
	renderAction?: (props: ActionRendererProps) => ReactNode;
	full?: true;
	order?: number;
	groups: Array<'group' | 'channel' | 'live' | 'direct' | 'direct_multiple' | 'team' | 'voip'>;
	hotkey?: string;
	action?: (e?: MouseEvent<HTMLElement>) => void;
	template?: ComponentType<{
		tabBar: ToolboxContextValue;
		_id: IRoom['_id'];
		rid: IRoom['_id'];
		teamId: IRoom['teamId'];
	}>;
	featured?: boolean;
};

import type { IRoom } from '@rocket.chat/core-typings';
import type { Box, Option } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactNode, MouseEvent, ComponentProps, ComponentType } from 'react';

import type { ToolboxContextValue } from '../../contexts/ToolboxContext';
import type { Events as GeneratorEvents } from './generator';
import { generator } from './generator';

type ToolboxHook = ({ room }: { room: IRoom }) => ToolboxActionConfig | null;

type ActionRendererProps = Omit<ToolboxActionConfig, 'renderAction' | 'groups' | 'title'> & {
	className: ComponentProps<typeof Box>['className'];
	index: number;
	title: string;
};

type OptionRendererProps = ComponentProps<typeof Option>;

export type OptionRenderer = (props: OptionRendererProps) => ReactNode;

export type ToolboxActionConfig = {
	'id': string;
	'icon'?: IconName;
	'title': TranslationKey;
	'anonymous'?: boolean;
	'tooltip'?: string;
	'data-tooltip'?: string;
	'disabled'?: boolean;
	'renderAction'?: (props: ActionRendererProps) => ReactNode;
	'full'?: true;
	'renderOption'?: OptionRenderer;
	'order'?: number;
	'groups': Array<'group' | 'channel' | 'live' | 'direct' | 'direct_multiple' | 'team' | 'voip'>;
	'hotkey'?: string;
	'action'?: (e?: MouseEvent<HTMLElement>) => void;
	'template'?: ComponentType<{
		tabBar: ToolboxContextValue;
		_id: IRoom['_id'];
		rid: IRoom['_id'];
		teamId: IRoom['teamId'];
	}>;
	'featured'?: boolean;
};

export type ToolboxAction = ToolboxHook | ToolboxActionConfig;

const { listen, store: actions } = generator<ToolboxAction>();

export type Events = GeneratorEvents<ToolboxAction>;

export { listen, actions };

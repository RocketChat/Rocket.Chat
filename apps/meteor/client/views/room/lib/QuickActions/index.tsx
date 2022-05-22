import type { IRoom } from '@rocket.chat/core-typings';
import { Box, Option } from '@rocket.chat/fuselage';
import { ComponentProps, ReactNode } from 'react';

import { ToolboxActionConfig } from '../Toolbox';
import { generator, Events as GeneratorEvents } from '../Toolbox/generator';

type QuickActionsHook = ({ room }: { room: IRoom }) => QuickActionsActionConfig | null;

type ActionRendererProps = Omit<QuickActionsActionConfig, 'renderAction' | 'groups'> & {
	className: ComponentProps<typeof Box>['className'];
	tabId: QuickActionsActionConfig['id'] | undefined;
	index: number;
};

export type ActionRenderer = (props: ActionRendererProps) => ReactNode;

type OptionRendererProps = ComponentProps<typeof Option>;

export type OptionRenderer = (props: OptionRendererProps) => ReactNode;

export type QuickActionsActionConfig = ToolboxActionConfig & {
	groups: Array<'live'>;
	color?: string;
};

export type QuickActionsAction = QuickActionsHook | QuickActionsActionConfig;

const { listen, add: addAction, remove: deleteAction, store: actions } = generator<QuickActionsAction>();

export type Events = GeneratorEvents<QuickActionsAction>;

export { listen, addAction, deleteAction, actions };

export enum QuickActionsEnum {
	MoveQueue = 'rocket-move-to-queue',
	ChatForward = 'rocket-chat-forward',
	Transcript = 'rocket-transcript',
	CloseChat = 'rocket-close-chat',
	OnHoldChat = 'rocket-on-hold-chat',
}

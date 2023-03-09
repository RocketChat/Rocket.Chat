import type { IRoom } from '@rocket.chat/core-typings';
import type { Box, Option } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactNode } from 'react';

import type { ToolboxActionConfig } from '../Toolbox';
import type { Events as GeneratorEvents } from '../Toolbox/generator';
import { generator } from '../Toolbox/generator';

type QuickActionsHook = ({ room }: { room: IRoom }) => QuickActionsActionConfig | null;

type ActionRendererProps = Omit<QuickActionsActionConfig, 'renderAction' | 'groups'> & {
	className: ComponentProps<typeof Box>['className'];
	tabId: QuickActionsActionConfig['id'] | undefined;
	index: number;
};

export type ActionRenderer = (props: ActionRendererProps) => ReactNode;

type OptionRendererProps = ComponentProps<typeof Option>;

export type OptionRenderer = (props: OptionRendererProps) => ReactNode;

export type QuickActionsActionOptions = Array<{
	id: string;
	label: TranslationKey;
	enabled?: boolean;
	validate?: (room: IRoom) => { value: boolean; tooltip: TranslationKey };
}>;

export type QuickActionsActionConfig = ToolboxActionConfig & {
	action?: (id?: QuickActionsActionConfig['id']) => void;
	groups: Array<'live'>;
	color?: string;
	options?: QuickActionsActionOptions;
};

export type QuickActionsAction = QuickActionsHook | QuickActionsActionConfig;

const { listen, add: addAction, remove: deleteAction, store: actions } = generator<QuickActionsAction>();

export type Events = GeneratorEvents<QuickActionsAction>;

export { listen, addAction, deleteAction, actions };

export enum QuickActionsEnum {
	MoveQueue = 'rocket-move-to-queue',
	ChatForward = 'rocket-chat-forward',
	Transcript = 'rocket-transcript',
	TranscriptEmail = 'rocket-transcript-email',
	TranscriptPDF = 'rocket-transcript-pdf',
	CloseChat = 'rocket-close-chat',
	OnHoldChat = 'rocket-on-hold-chat',
}

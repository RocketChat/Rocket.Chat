import { FC } from 'react';
import { Emitter, Handler } from '@rocket.chat/emitter';

import { IRoom } from '../../../../definition/IRoom';

type ToolboxHook = ({ room }: { room: IRoom }) => ToolboxActionConfig | null

export type ToolboxActionConfig = {
	id: string;
	icon: string;
	title: string;
	renderAction?: FC;
	renderOption?: FC;
	order?: number;
	groups: Array<'group' | 'channel' | 'live' | 'direct' | 'direct_multiple'>;
	hotkey?: string;
	action?: Function;
	template?: string;
}

export type ToolboxAction = ToolboxHook | ToolboxActionConfig;

const ev = new Emitter();

export type ActionsStore = Map<string, ToolboxAction>;

export const actions: ActionsStore = new Map();

export const addAction = (id: ToolboxActionConfig['id'], action: ToolboxAction): ActionsStore => {
	actions.set(id, action);
	ev.emit('change', actions);
	return actions;
};

export const deleteAction = (id: ToolboxActionConfig['id']): boolean => {
	const result = actions.delete(id);
	ev.emit('change', actions);
	return result;
};

export const listen = (handler: Handler): Function => ev.on('change', handler);

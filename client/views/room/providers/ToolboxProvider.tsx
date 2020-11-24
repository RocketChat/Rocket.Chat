import React, { ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useDebouncedState, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Handler } from '@rocket.chat/emitter';

import { ToolboxContext } from '../../../channel/lib/Toolbox/ToolboxContext';
import { ToolboxAction, ActionsStore, ToolboxActionConfig } from '../../../channel/lib/Toolbox/index';
import { IRoom } from '../../../../definition/IRoom';

const groupsDict = {
	l: 'live',
	d: 'direct',
	p: 'group',
	c: 'channel',
};


const VirtualAction = React.memo(({ handleChange, room, action, id }: { id: string; action: ToolboxAction; room: IRoom; handleChange: Function}): null => {
	const config = typeof action === 'function' ? action({ room }) : action;

	const group = groupsDict[room.t];
	const visible = config && (!config.groups || (groupsDict[room.t] && config.groups.includes(group as any)));

	useEffect(() => {
		handleChange((list: ActionsStore) => {
			visible && config ? list.get(id) !== config && list.set(id, config) : list.delete(id);
		});
		return (): void => {
			handleChange((list: ActionsStore) => list.delete(id));
		};
	}, [config, visible, handleChange, id]);

	return null;
});

const useToolboxActions = (room: IRoom): { listen: (handler: Handler<any>) => Function; actions: Array<[string, ToolboxAction]> } => {
	const { listen, actions } = useContext(ToolboxContext);
	const [state, setState] = useState<Array<[string, ToolboxAction]>>(Array.from(actions.entries()));

	useEffect(() => {
		const stop = listen((actions) => {
			setState(Array.from(actions.entries()));
		});
		return (): void => { stop(); };
	}, [listen, room, setState]);

	return { listen, actions: state };
};


export const ToolboxProvider = ({ children, room, tabBar }: { children: ReactNode; room: IRoom; tabBar: any }): JSX.Element => {
	const [activeTabBar, setActiveTabBar] = useState<ToolboxActionConfig|undefined>();
	const [list, setList] = useDebouncedState<ActionsStore>(new Map(), 5);
	const handleChange = useMutableCallback((fn) => { fn(list); setList((list) => new Map(list)); });
	const { listen, actions } = useToolboxActions(room);


	const open = useMutableCallback((actionId) => {
		setActiveTabBar(list.get(actionId) as ToolboxActionConfig);
	});

	const close = useMutableCallback(() => {
		setActiveTabBar(undefined);
	});

	const context = useMemo(() => ({
		listen,
		tabBar,
		actions: new Map(list),
		activeTabBar,
		open,
		close,
	}), [listen, tabBar, list, activeTabBar, open, close]);

	return <ToolboxContext.Provider value={context}>
		{ actions.map(([id, item]) => <VirtualAction action={item} room={room} id={id} key={id} handleChange={handleChange} />) }
		{children}
	</ToolboxContext.Provider>;
};

export const useTab = (): ToolboxActionConfig | undefined => useContext(ToolboxContext).activeTabBar;
export const useTabBarOpen = (): Function => useContext(ToolboxContext).open;
export const useTabBarClose = (): Function => useContext(ToolboxContext).close;

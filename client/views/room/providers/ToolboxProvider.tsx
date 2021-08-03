import { useDebouncedState, useMutableCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import React, {
	ReactNode,
	useContext,
	useMemo,
	useState,
	useCallback,
	useLayoutEffect,
	MouseEventHandler,
} from 'react';

import { IRoom } from '../../../../definition/IRoom';
import { useCurrentRoute, useRoute } from '../../../contexts/RouterContext';
import { useSession } from '../../../contexts/SessionContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useUserId } from '../../../contexts/UserContext';
import { ToolboxContext, ToolboxEventHandler } from '../lib/Toolbox/ToolboxContext';
import { Store } from '../lib/Toolbox/generator';
import { ToolboxAction, ToolboxActionConfig } from '../lib/Toolbox/index';
import VirtualAction from './VirtualAction';

const useToolboxActions = (
	room: IRoom,
): { listen: ToolboxEventHandler; actions: Array<[string, ToolboxAction]> } => {
	const { listen, actions } = useContext(ToolboxContext);
	const [state, setState] = useState<Array<[string, ToolboxAction]>>(Array.from(actions.entries()));

	useLayoutEffect(() => {
		const stop = listen((actions) => {
			setState(Array.from(actions.entries()));
		});
		return (): void => {
			stop();
		};
	}, [listen, room, setState]);

	return { listen, actions: state };
};

const ToolboxProvider = ({ children, room }: { children: ReactNode; room: IRoom }): JSX.Element => {
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');
	const uid = useUserId();
	const [activeTabBar, setActiveTabBar] = useState<[ToolboxActionConfig | undefined, string?]>([
		undefined,
	]);
	const [list, setList] = useSafely(useDebouncedState<Store<ToolboxAction>>(new Map(), 5));
	const handleChange = useMutableCallback((fn) => {
		fn(list);
		setList((list) => new Map(list));
	});
	const { listen, actions } = useToolboxActions(room);

	const [routeName, params] = useCurrentRoute();
	const router = useRoute(routeName || '');

	const currentRoom = useSession('openedRoom');

	const tab = params?.tab;
	const context = params?.context;

	const close = useMutableCallback(() => {
		router.push({
			...params,
			tab: '',
			context: '',
		});
	});

	const open = useMutableCallback((actionId, context) => {
		if (actionId === activeTabBar[0]?.id && context === undefined) {
			return close();
		}
		router.push({
			...params,
			tab: actionId,
			context,
		});
	});

	const openUserInfo = useCallback(
		(username) => {
			switch (room.t) {
				case 'l':
					open('room-info', username);
					break;
				case 'd':
					open('user-info', username);
					break;
				default:
					open('members-list', username);
					break;
			}
		},
		[room.t, open],
	);

	useLayoutEffect(() => {
		if (!tab) {
			setActiveTabBar([undefined, undefined]);
		}

		setActiveTabBar([list.get(tab as string) as ToolboxActionConfig, context]);
	}, [tab, list, currentRoom, context]);

	const contextValue = useMemo(
		() => ({
			listen,
			actions: new Map(list),
			activeTabBar: activeTabBar[0],
			context: activeTabBar[1],
			open,
			close,
			openUserInfo,
		}),
		[listen, list, activeTabBar, open, close, openUserInfo],
	);

	return (
		<ToolboxContext.Provider value={contextValue}>
			{actions
				.filter(
					([, action]) =>
						uid ||
						(allowAnonymousRead &&
							action.hasOwnProperty('anonymous') &&
							(action as ToolboxActionConfig).anonymous),
				)
				.map(([id, item]) => (
					<VirtualAction
						action={item}
						room={room}
						id={id}
						key={id + room._id}
						handleChange={handleChange}
					/>
				))}
			{children}
		</ToolboxContext.Provider>
	);
};

export const useTabContext = (): ToolboxActionConfig | undefined =>
	useContext(ToolboxContext).context;
export const useTab = (): ToolboxActionConfig | undefined =>
	useContext(ToolboxContext).activeTabBar;
export const useTabBarOpen = (): Function => useContext(ToolboxContext).open;
export const useTabBarClose = (): MouseEventHandler<HTMLOrSVGElement> =>
	useContext(ToolboxContext).close;
export const useTabBarOpenUserInfo = (): Function => useContext(ToolboxContext).openUserInfo;

export default ToolboxProvider;

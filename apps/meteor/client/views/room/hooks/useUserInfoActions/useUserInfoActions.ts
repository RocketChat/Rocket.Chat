import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';
import { useMemo } from 'react';

import { useEmbeddedLayout } from '../../../../hooks/useEmbeddedLayout';
import { useBlockUserAction } from './actions/useBlockUserAction';
import { useCallAction } from './actions/useCallAction';
import { useChangeLeaderAction } from './actions/useChangeLeaderAction';
import { useChangeModeratorAction } from './actions/useChangeModeratorAction';
import { useChangeOwnerAction } from './actions/useChangeOwnerAction';
import { useDirectMessageAction } from './actions/useDirectMessageAction';
import { useIgnoreUserAction } from './actions/useIgnoreUserAction';
import { useMuteUserAction } from './actions/useMuteUserAction';
import { useRedirectModerationConsole } from './actions/useRedirectModerationConsole';
import { useRemoveUserAction } from './actions/useRemoveUserAction';

export type UserInfoAction = {
	id: string;
	content: ReactNode;
	icon?: ComponentProps<typeof Icon>['name'];
	onClick: () => void;
	type?: string;
};

type UserMenuOption = {
	content: ReactNode;
	icon?: string;
	onClick: () => void;
	type?: string;
};

const mapUserOptions = ([key, { onClick, content, icon, type }]: [string, UserInfoAction]): [string, UserMenuOption] => [
	key,
	{
		content,
		icon,
		onClick,
		type,
	},
];

export const useUserInfoActions = (
	user: Pick<IUser, '_id' | 'username'>,
	rid: IRoom['_id'],
	reload?: () => void,
): { actions: [string, UserInfoAction][]; menuActions: any | undefined } => {
	const blockUserOption = useBlockUserAction(user, rid);
	const changeLeaderOption = useChangeLeaderAction(user, rid);
	const changeModeratorOption = useChangeModeratorAction(user, rid);
	const openModerationConsoleOption = useRedirectModerationConsole(user._id);
	const changeOwnerOption = useChangeOwnerAction(user, rid);
	const openDirectMessageOption = useDirectMessageAction(user, rid);
	const ignoreUserOption = useIgnoreUserAction(user, rid);
	const muteUserOption = useMuteUserAction(user, rid);
	const removeUserOption = useRemoveUserAction(user, rid, reload);
	const callOption = useCallAction(user);
	const isLayoutEmbedded = useEmbeddedLayout();

	const userinfoActions = useMemo(
		() => ({
			...(openDirectMessageOption && !isLayoutEmbedded && { openDirectMessage: openDirectMessageOption }),
			...(callOption && { call: callOption }),
			...(changeOwnerOption && { changeOwner: changeOwnerOption }),
			...(changeLeaderOption && { changeLeader: changeLeaderOption }),
			...(changeModeratorOption && { changeModerator: changeModeratorOption }),
			...(openModerationConsoleOption && { openModerationConsole: openModerationConsoleOption }),
			...(ignoreUserOption && { ignoreUser: ignoreUserOption }),
			...(muteUserOption && { muteUser: muteUserOption }),
			...(blockUserOption && { toggleBlock: blockUserOption }),
			...(removeUserOption && { removeUser: removeUserOption }),
		}),
		[
			openDirectMessageOption,
			isLayoutEmbedded,
			callOption,
			changeOwnerOption,
			changeLeaderOption,
			changeModeratorOption,
			ignoreUserOption,
			muteUserOption,
			blockUserOption,
			removeUserOption,
			openModerationConsoleOption,
		],
	);

	const actionSpread = useMemo(() => {
		const entries = Object.entries(userinfoActions);

		const options = entries.slice(0, 2);
		const menuOptions = entries.slice(2, entries.length).map(mapUserOptions);
		const menu = menuOptions.length ? Object.fromEntries(menuOptions) : undefined;

		const menuActions =
			menu !== undefined &&
			Object.values(menu)
				.map((item) => ({
					id: item.content as string,
					content: item.content,
					icon: item.icon,
					onClick: item.onClick,
					type: item.type,
				}))
				.reduce((acc, item) => {
					const group = item.type ? item.type : '';
					const section = acc.find((section: { id: string }) => section.id === group);
					if (section) {
						section.items.push(item);
						return acc;
					}

					const newSection = { id: group, title: '', items: [item] };
					acc.push(newSection);

					return acc;
				}, [] as any);

		return { actions: options, menuActions };
	}, [userinfoActions]);

	return actionSpread;
};

import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';
import { useMemo } from 'react';

import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';
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
	content: ReactNode;
	icon?: ComponentProps<typeof Icon>['name'];
	onClick: () => void;
	type?: 'communication' | 'privileges' | 'management';
	color?: string;
};

type UserMenuAction = {
	id: string;
	title: string;
	items: GenericMenuItemProps[];
}[];

export const useUserInfoActions = (
	user: Pick<IUser, '_id' | 'username'>,
	rid: IRoom['_id'],
	reload?: () => void,
	size = 2,
): { actions: [string, UserInfoAction][]; menuActions: any | undefined } => {
	const blockUser = useBlockUserAction(user, rid);
	const changeLeader = useChangeLeaderAction(user, rid);
	const changeModerator = useChangeModeratorAction(user, rid);
	const openModerationConsole = useRedirectModerationConsole(user._id);
	const changeOwner = useChangeOwnerAction(user, rid);
	const openDirectMessage = useDirectMessageAction(user, rid);
	const ignoreUser = useIgnoreUserAction(user, rid);
	const muteUser = useMuteUserAction(user, rid);
	const removeUser = useRemoveUserAction(user, rid, reload);
	const call = useCallAction(user);
	const isLayoutEmbedded = useEmbeddedLayout();

	const userinfoActions = useMemo(
		() => ({
			...(openDirectMessage && !isLayoutEmbedded && { openDirectMessage }),
			...(call && { call }),
			...(changeOwner && { changeOwner }),
			...(changeLeader && { changeLeader }),
			...(changeModerator && { changeModerator }),
			...(openModerationConsole && { openModerationConsole }),
			...(ignoreUser && { ignoreUser }),
			...(muteUser && { muteUser }),
			...(blockUser && { toggleBlock: blockUser }),
			...(removeUser && { removeUser }),
		}),
		[
			openDirectMessage,
			isLayoutEmbedded,
			call,
			changeOwner,
			changeLeader,
			changeModerator,
			ignoreUser,
			muteUser,
			blockUser,
			removeUser,
			openModerationConsole,
		],
	);

	const actionSpread = useMemo(() => {
		const entries = Object.entries(userinfoActions);

		const options = entries.slice(0, size);
		const slicedOptions = entries.slice(size, entries.length);
		const menu = slicedOptions.length ? Object.fromEntries(slicedOptions) : undefined;

		const menuActions =
			menu !== undefined &&
			Object.values(menu)
				.map((item) => ({
					variant: item.color === 'alert' && ('danger' as const),
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
				}, [] as UserMenuAction);

		return { actions: options, menuActions };
	}, [userinfoActions]);

	return actionSpread;
};

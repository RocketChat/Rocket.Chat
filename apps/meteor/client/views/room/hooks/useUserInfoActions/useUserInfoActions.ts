import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { Icon } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useEmbeddedLayout } from '@rocket.chat/ui-client';
import { useLayoutHiddenActions } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';

import { useAddUserAction } from './actions/useAddUserAction';
import { useBanUserAction } from './actions/useBanUserAction';
import { useBlockUserAction } from './actions/useBlockUserAction';
import { useChangeLeaderAction } from './actions/useChangeLeaderAction';
import { useChangeModeratorAction } from './actions/useChangeModeratorAction';
import { useChangeOwnerAction } from './actions/useChangeOwnerAction';
import { useDirectMessageAction } from './actions/useDirectMessageAction';
import { useEditProfileAction } from './actions/useEditProfileAction';
import { useIgnoreUserAction } from './actions/useIgnoreUserAction';
import { useMuteUserAction } from './actions/useMuteUserAction';
import { useRedirectModerationConsole } from './actions/useRedirectModerationConsole';
import { useRemoveUserAction } from './actions/useRemoveUserAction';
import { useReportUser } from './actions/useReportUser';
import { useUserMediaCallAction } from './actions/useUserMediaCallAction';
import { useVideoCallAction } from './actions/useVideoCallAction';

export type UserInfoActionType = 'communication' | 'privileges' | 'management' | 'moderation' | 'admin';

type UserInfoActionWithOnlyIcon = {
	type?: UserInfoActionType;
	content?: string;
	icon: ComponentProps<typeof Icon>['name'];
	title: string;
	variant?: 'danger';
	onClick: () => void;
	disabled?: boolean;
};

type UserInfoActionWithContent = {
	type?: UserInfoActionType;
	content: string;
	icon?: ComponentProps<typeof Icon>['name'];
	title?: string;
	variant?: 'danger';
	onClick: () => void;
	disabled?: boolean;
};

export type UserInfoAction = UserInfoActionWithContent | UserInfoActionWithOnlyIcon;

export type UserMenuAction = {
	id: string;
	title: string;
	items: GenericMenuItemProps[];
}[];

type UserInfoActionsParams = {
	user: Pick<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension'>;
	rid: IRoom['_id'];
	reload?: () => void;
	size?: number;
	isMember?: boolean;
	isInvited?: boolean;
};

type UseUserInfoActionsResult = {
	actions: [string, UserInfoAction][];
	menuActions: UserMenuAction | undefined;
};

export const useUserInfoActions = ({
	user,
	rid,
	reload,
	size = 2,
	isMember,
	isInvited,
}: UserInfoActionsParams): UseUserInfoActionsResult => {
	const addUser = useAddUserAction(user, rid, reload);
	const blockUser = useBlockUserAction(user, rid);
	const changeLeader = useChangeLeaderAction(user, rid);
	const changeModerator = useChangeModeratorAction(user, rid);
	const openModerationConsole = useRedirectModerationConsole(user._id);
	const changeOwner = useChangeOwnerAction(user, rid);
	const openDirectMessage = useDirectMessageAction(user, rid);
	const editProfile = useEditProfileAction(user);
	const ignoreUser = useIgnoreUserAction(user, rid);
	const muteUser = useMuteUserAction(user, rid);
	const removeUser = useRemoveUserAction(user, rid, reload, isInvited);
	const banUser = useBanUserAction(user, rid);
	const videoCall = useVideoCallAction(user);
	const reportUserOption = useReportUser(user);
	const isLayoutEmbedded = useEmbeddedLayout();
	const { userToolbox: hiddenActions } = useLayoutHiddenActions();
	const userMediaCall = useUserMediaCallAction(user, rid);

	const userinfoActions = useMemo(
		() => ({
			...(openDirectMessage && !isLayoutEmbedded && { openDirectMessage }),
			...(editProfile && { editProfile }),
			...(videoCall && { videoCall }),
			...(userMediaCall && { userMediaCall }),
			// Closes the 'communication' block. Kept adjacent to its peers so the
			// group survives the actionSpread slice below: the first `size` entries
			// leave the menu to become standalone buttons, and a straggler declared
			// after the other groups would have its section rebuilt at the bottom,
			// below the danger items.
			...(isMember && openModerationConsole && { openModerationConsole }),
			...(isMember && muteUser && { muteUser }),
			...(!isMember && addUser && { addUser }),
			...(isMember && changeOwner && { changeOwner }),
			...(isMember && changeLeader && { changeLeader }),
			...(isMember && changeModerator && { changeModerator }),
			...(isMember && ignoreUser && { ignoreUser }),
			...(blockUser && { toggleBlock: blockUser }),
			...((isMember || isInvited) && removeUser && { removeUser }),
			...((isMember || isInvited) && banUser && { banUser }),
			...(reportUserOption && { reportUser: reportUserOption }),
		}),
		[
			openDirectMessage,
			editProfile,
			isLayoutEmbedded,
			videoCall,
			userMediaCall,
			changeOwner,
			changeLeader,
			changeModerator,
			ignoreUser,
			muteUser,
			blockUser,
			removeUser,
			reportUserOption,
			openModerationConsole,
			addUser,
			banUser,
			isMember,
			isInvited,
		],
	);

	const actionSpread = useMemo(() => {
		const entries = Object.entries(userinfoActions).filter(([key]) => !hiddenActions.includes(key));

		const options = entries.slice(0, size);
		const slicedOptions = entries.slice(size, entries.length);

		const menuActions = slicedOptions.reduce((acc, [_key, item]) => {
			const group = item.type ? item.type : '';
			const section = acc.find((section: { id: string }) => section.id === group);

			const newItem = {
				...item,
				id: item.content || item.title || '',
				content: item.content || item.title,
			};

			if (section) {
				section.items.push(newItem);
				return acc;
			}

			// GenericMenu translates section titles that are i18n keys
			const newSection = { id: group, title: group === 'privileges' ? 'Manage_room_roles' : '', items: [newItem] };
			acc.push(newSection);

			return acc;
		}, [] as UserMenuAction);

		return { actions: options, menuActions };
	}, [size, userinfoActions, hiddenActions]);

	return actionSpread;
};

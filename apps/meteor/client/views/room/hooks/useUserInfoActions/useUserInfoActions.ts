import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import type { Action } from '../../../hooks/useActionSpread';
import { useBlockUserAction } from './actions/useBlockUserAction';
import { useCallAction } from './actions/useCallAction';
import { useChangeLeaderAction } from './actions/useChangeLeaderAction';
import { useChangeModeratorAction } from './actions/useChangeModeratorAction';
import { useChangeOwnerAction } from './actions/useChangeOwnerAction';
import { useDirectMessageAction } from './actions/useDirectMessageAction';
import { useIgnoreUserAction } from './actions/useIgnoreUserAction';
import { useMuteUserAction } from './actions/useMuteUserAction';
import { useRemoveUserAction } from './actions/useRemoveUserAction';

export const useUserInfoActions = (
	user: Pick<IUser, '_id' | 'username'>,
	rid: IRoom['_id'],
	reload?: () => void,
): {
	[key: string]: Action;
} => {
	const blockUserOption = useBlockUserAction(user, rid);
	const changeLeaderOption = useChangeLeaderAction(user, rid);
	const changeModeratorOption = useChangeModeratorAction(user, rid);
	const changeOwnerOption = useChangeOwnerAction(user, rid);
	const openDirectMessageOption = useDirectMessageAction(user, rid);
	const ignoreUserOption = useIgnoreUserAction(user, rid);
	const muteUserOption = useMuteUserAction(user, rid);
	const removeUserOption = useRemoveUserAction(user, rid, reload);
	const callOption = useCallAction(user);

	return useMemo(
		() => ({
			...(openDirectMessageOption && { openDirectMessage: openDirectMessageOption }),
			...(callOption && { call: callOption }),
			...(changeOwnerOption && { changeOwner: changeOwnerOption }),
			...(changeLeaderOption && { changeLeader: changeLeaderOption }),
			...(changeModeratorOption && { changeModerator: changeModeratorOption }),
			...(ignoreUserOption && { ignoreUser: ignoreUserOption }),
			...(muteUserOption && { muteUser: muteUserOption }),
			...(blockUserOption && { toggleBlock: blockUserOption }),
			...(removeUserOption && { removeUser: removeUserOption }),
		}),
		[
			changeLeaderOption,
			changeModeratorOption,
			changeOwnerOption,
			ignoreUserOption,
			muteUserOption,
			openDirectMessageOption,
			removeUserOption,
			callOption,
			blockUserOption,
		],
	);
};

import type { IUser } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import { useEmbeddedLayout } from '../../../../hooks/useEmbeddedLayout';
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
	reload?: () => void,
): {
	[key: string]: Action;
} => {
	const blockUserOption = useBlockUserAction(user);
	const changeLeaderOption = useChangeLeaderAction(user);
	const changeModeratorOption = useChangeModeratorAction(user);
	const changeOwnerOption = useChangeOwnerAction(user);
	const openDirectMessageOption = useDirectMessageAction(user);
	const ignoreUserOption = useIgnoreUserAction(user);
	const muteUserOption = useMuteUserAction(user);
	const removeUserOption = useRemoveUserAction(user, reload);
	const callOption = useCallAction(user);
	const isLayoutEmbedded = useEmbeddedLayout();

	return useMemo(
		() => ({
			...(openDirectMessageOption && !isLayoutEmbedded && { openDirectMessage: openDirectMessageOption }),
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
			isLayoutEmbedded,
		],
	);
};

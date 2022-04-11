import { useMemo } from 'react';

import { IRoom } from '../../../../../definition/IRoom';
import { IUser } from '../../../../../definition/IUser';
import { Action } from '../../../hooks/useActionSpread';
import { useUserRoom } from '../useUserRoom';
import { useAudioCallAction } from './actions/useAudioCallAction';
import { useBlockUserAction } from './actions/useBlockUserAction';
import { useChangeLeaderAction } from './actions/useChangeLeaderAction';
import { useChangeModeratorAction } from './actions/useChangeModeratorAction';
import { useChangeOwnerAction } from './actions/useChangeOwnerAction';
import { useDirectMessageAction } from './actions/useDirectMessageAction';
import { useIgnoreUserAction } from './actions/useIgnoreUserAction';
import { useMuteUserAction } from './actions/useMuteUserAction';
import { useRemoveUserAction } from './actions/useRemoveUserAction';
import { useVideoCallAction } from './actions/useVideoCallAction';

export const useUserInfoActions = (
	user: Pick<IUser, '_id' | 'username'>,
	rid: IRoom['_id'],
	reload: () => void,
): {
	[key: string]: Action;
} => {
	const room = useUserRoom(rid);
	const audioCallOption = useAudioCallAction(rid);
	const blockUserOption = useBlockUserAction(room, user);
	const changeLeaderOption = useChangeLeaderAction(room, user);
	const changeModeratorOption = useChangeModeratorAction(room, user);
	const changeOwnerOption = useChangeOwnerAction(room, user);
	const openDirectMessageOption = useDirectMessageAction(rid, user);
	const ignoreUserOption = useIgnoreUserAction(room, user);
	const muteUserOption = useMuteUserAction(room, user);
	const removeUserOption = useRemoveUserAction(room, user, reload);
	const videoCallOption = useVideoCallAction(rid);

	return useMemo(
		() => ({
			...(openDirectMessageOption && { openDirectMessage: openDirectMessageOption }),
			...(videoCallOption && { video: videoCallOption }),
			...(audioCallOption && { audio: audioCallOption }),
			...(changeOwnerOption && { changeOwner: changeOwnerOption }),
			...(changeLeaderOption && { changeLeader: changeLeaderOption }),
			...(changeModeratorOption && { changeModerator: changeModeratorOption }),
			...(ignoreUserOption && { ignoreUser: ignoreUserOption }),
			...(muteUserOption && { muteUser: muteUserOption }),
			...(blockUserOption && { toggleBlock: blockUserOption }),
			...(removeUserOption && { removeUser: removeUserOption }),
		}),
		[
			audioCallOption,
			changeLeaderOption,
			changeModeratorOption,
			changeOwnerOption,
			ignoreUserOption,
			muteUserOption,
			openDirectMessageOption,
			removeUserOption,
			videoCallOption,
			blockUserOption,
		],
	);
};

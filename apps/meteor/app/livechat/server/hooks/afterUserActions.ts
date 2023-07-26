import type { IUser } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { Livechat } from '../lib/Livechat';
import { callbackLogger } from '../lib/logger';

type IAfterSaveUserProps = {
	user: IUser;
	oldUser: IUser | null;
};

const wasAgent = (user: Pick<IUser, 'roles'> | null) => user?.roles?.includes('livechat-agent');
const isAgent = (user: Pick<IUser, 'roles'> | null) => user?.roles?.includes('livechat-agent');

const handleAgentUpdated = async (userData: IAfterSaveUserProps) => {
	const {
		user: { _id: userId, username },
		user: newUser,
		oldUser,
	} = userData;

	if (wasAgent(oldUser) && !isAgent(newUser)) {
		callbackLogger.debug('Removing agent', userId);
		await Livechat.removeAgent(username);
	}

	if (!wasAgent(oldUser) && isAgent(newUser)) {
		callbackLogger.debug('Adding agent', userId);
		await Livechat.addAgent(username);
	}
};

const handleDeactivateUser = async (user: IUser) => {
	if (wasAgent(user)) {
		callbackLogger.debug('Removing agent', user._id);
		await Livechat.removeAgent(user.username);
	}
};

const handleActivateUser = async (user: IUser) => {
	if (isAgent(user)) {
		callbackLogger.debug('Adding agent', user._id);
		await Livechat.addAgent(user.username);
	}
};

callbacks.add('afterSaveUser', handleAgentUpdated, callbacks.priority.LOW, 'livechat-after-save-user-update-agent');

callbacks.add('afterDeactivateUser', handleDeactivateUser, callbacks.priority.LOW, 'livechat-after-deactivate-user-remove-agent');

callbacks.add('afterActivateUser', handleActivateUser, callbacks.priority.LOW, 'livechat-after-activate-user-add-agent');

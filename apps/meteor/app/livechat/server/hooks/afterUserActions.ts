import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { Livechat } from '../lib/Livechat';
import { callbackLogger } from '../lib/logger';

type Props = {
	user: IUser;
	oldUser: IUser | null;
};

const handleAgentUpdated = async (userData: Props) => {
	const {
		user: { _id: userId, username },
		oldUser,
	} = userData;

	if (!userData.user?.roles?.includes('livechat-agent')) {
		callbackLogger.debug('Removing extension', userId);
		await Users.unsetExtension(userId);
	}

	if (oldUser?.roles?.includes('livechat-agent') && !userData.user?.roles?.includes('livechat-agent')) {
		callbackLogger.error('Removing agent', userId);
		await Livechat.removeAgent(username);
	}

	if (userData.user?.roles?.includes('livechat-agent') && !oldUser?.roles?.includes('livechat-agent')) {
		callbackLogger.error('Adding agent', userId);
		await Livechat.addAgent(username);
	}
};

const handleDeactivateUser = async (userData: IUser) => {
	if (userData?.roles?.includes('livechat-agent')) {
		await Users.unsetExtension(userData._id);
	}
};

callbacks.add('afterSaveUser', handleAgentUpdated, callbacks.priority.LOW, 'livechat-after-save-user-remove-extension');

callbacks.add('afterDeactivateUser', handleDeactivateUser, callbacks.priority.LOW, 'livechat-after-deactivate-user-remove-extension');

import { type IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { Livechat as LivechatTyped } from '../lib/LivechatTyped';

type IAfterSaveUserProps = {
	user: IUser;
	oldUser: IUser | null;
};

const wasAgent = (user: Pick<IUser, 'roles'> | null) => user?.roles?.includes('livechat-agent');
const isAgent = (user: Pick<IUser, 'roles'> | null) => user?.roles?.includes('livechat-agent');

const handleAgentUpdated = async (userData: IAfterSaveUserProps) => {
	const { user: newUser, oldUser } = userData;

	if (wasAgent(oldUser) && !isAgent(newUser)) {
		await LivechatTyped.afterRemoveAgent(newUser);
	}

	if (!wasAgent(oldUser) && isAgent(newUser)) {
		await LivechatTyped.afterAgentAdded(newUser);
	}
};

const handleAgentCreated = async (user: IUser) => {
	// created === no prev roles :)
	if (isAgent(user)) {
		await LivechatTyped.afterAgentAdded(user);
	}
};

const handleDeactivateUser = async (user: IUser) => {
	if (wasAgent(user)) {
		await Users.makeAgentUnavailableAndUnsetExtension(user._id);
	}
};

const handleActivateUser = async (user: IUser) => {
	if (isAgent(user) && user.username) {
		await LivechatTyped.afterAgentUserActivated(user);
	}
};

callbacks.add('afterCreateUser', handleAgentCreated, callbacks.priority.LOW, 'livechat-after-create-user-update-agent');

callbacks.add('afterSaveUser', handleAgentUpdated, callbacks.priority.LOW, 'livechat-after-save-user-update-agent');

callbacks.add('afterDeactivateUser', handleDeactivateUser, callbacks.priority.LOW, 'livechat-after-deactivate-user-remove-agent');

callbacks.add('afterActivateUser', handleActivateUser, callbacks.priority.LOW, 'livechat-after-activate-user-add-agent');

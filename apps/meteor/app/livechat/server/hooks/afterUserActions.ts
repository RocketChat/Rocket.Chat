import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { UsersUpdateParamsPOST } from '@rocket.chat/rest-typings';

import { callbacks } from '../../../../lib/callbacks';

type UserData = UsersUpdateParamsPOST['data'] & { _id: string };

const handleAgentUpdated = async (userData: UserData) => {
	if (!userData?.roles?.includes('livechat-agent')) {
		await Users.unsetExtension(userData._id);
	}
};

const handleDeactivateUser = async (userData: IUser) => {
	if (userData?.roles?.includes('livechat-agent')) {
		await Users.unsetExtension(userData._id);
	}
};

callbacks.add(
	'afterSaveUser',
	(user: UserData) => Promise.await(handleAgentUpdated(user)),
	callbacks.priority.LOW,
	'livechat-after-save-user-remove-extension',
);

callbacks.add(
	'afterDeactivateUser',
	(user: IUser) => Promise.await(handleDeactivateUser(user)),
	callbacks.priority.LOW,
	'livechat-after-deactivate-user-remove-extension',
);

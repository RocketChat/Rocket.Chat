import { Permissions } from '@rocket.chat/models';

export const createAutoTranslatePermissions = async (): Promise<void> => {
	if (!(await Permissions.findOne({ _id: 'auto-translate' }))) {
		await Permissions.create('auto-translate', ['admin']);
	}
};

import type { IRole } from '@rocket.chat/core-typings';

import { Roles } from '../../../app/models/server/raw';

export const validateRoleList = async (roleIds: IRole['_id'][]): Promise<boolean> => {
	const options = {
		projection: {
			_id: 1,
		},
	};

	const existingRoleIds = (await Roles.findInIds<Pick<IRole, '_id'>>(roleIds, options).toArray()).map(({ _id }) => _id);
	return !roleIds.find((_id) => !existingRoleIds.includes(_id));
};

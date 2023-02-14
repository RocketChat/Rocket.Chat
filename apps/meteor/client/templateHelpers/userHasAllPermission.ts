import type { IPermission, IRole, IUser } from '@rocket.chat/core-typings';
import { Template } from 'meteor/templating';

import { userHasAllPermission } from '../../app/authorization/client';

Template.registerHelper(
	'userHasAllPermission',
	(userId: IUser['_id'] | null, permission: IPermission['_id'] | IPermission['_id'][], scope: IRole['scope']) =>
		userHasAllPermission(permission, scope, userId),
);

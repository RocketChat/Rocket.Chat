import { Template } from 'meteor/templating';

import { userHasAllPermission } from '../../app/authorization/client';
import { IPermission } from '../../definition/IPermission';
import { IRole, IUser } from '../../definition/IUser';

Template.registerHelper(
	'userHasAllPermission',
	(userId: IUser['_id'] | null, permission: IPermission['_id'] | IPermission['_id'][], scope: IRole['scope']) =>
		userHasAllPermission(permission, scope, userId),
);

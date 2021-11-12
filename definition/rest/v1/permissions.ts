import { Match, check } from 'meteor/check';

import { IPermission } from '../../IPermission';


type PermissionsUpdateProps = { permissions: { _id: string; roles: string[] }[] };

export const isBodyParamsValidPermissionUpdate = (bodyParams: object): bodyParams is PermissionsUpdateProps => {
	check(bodyParams, {
		permissions: [
			Match.ObjectIncluding({
				_id: String,
				roles: [String],
			}),
		],
	});
	return true;
};


export type PermissionsEndpoints = {
	'permissions.listAll': {
		GET: (params: { updatedSince?: string }) => ({
			update: IPermission[];
			remove: IPermission[];
		});
	};
	'permissions.update': {
		POST: (params: PermissionsUpdateProps) => ({
			permissions: IPermission[];
		});
	};
};

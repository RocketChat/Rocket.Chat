import { Match, check } from 'meteor/check';

import { IRole, IUser } from '../../IUser';

type RoleCreateProps = Pick<IRole, 'name'> & Partial<Pick<IRole, 'scope' | 'description' | 'mandatory2fa'>>;

export const isRoleCreateProps = (props: any): props is RoleCreateProps => {
	check(props, {
		name: String,
		scope: Match.Maybe(String),
		description: Match.Maybe(String),
		mandatory2fa: Match.Maybe(Boolean),
	});

	return true;
};

type RoleUpdateProps = { roleId: IRole['_id']; name: IRole['name'] } & Partial<RoleCreateProps>;

export const isRoleUpdateProps = (props: any): props is RoleUpdateProps => {
	check(props, {
		roleId: String,
		name: String,
		scope: Match.Maybe(String),
		description: Match.Maybe(String),
		mandatory2fa: Match.Maybe(Boolean),
	});
	return true;
};

type RoleDeleteProps = { roleId: IRole['_id'] };

export const isRoleDeleteProps = (props: any): props is RoleDeleteProps => {
	check(props, {
		roleId: String,
	});
	return true;
};


type RoleAddUserToRoleProps = {
	userName: string;
	roleName: string;
	roomId?: string;
}

export const isRoleAddUserToRoleProps = (props: any): props is RoleAddUserToRoleProps => {
	check(props, {
		roleName: String,
		username: String,
		roomId: Match.Maybe(String),
	});
	return true;
};


type RoleRemoveUserFromRoleProps = {
	username: string;
	roleName: string;
	roomId?: string;
}

export const isRoleRemoveUserFromRoleProps = (props: any): props is RoleRemoveUserFromRoleProps => {
	check(props, {
		roleName: String,
		username: String,
		roomId: Match.Maybe(String),
	});
	return true;
};


type RoleSyncProps = {
	updatedSince?: string;
}

export type RolesEndpoints = {
	'roles.list': {
		GET: () => ({
			roles: IRole[];
		});
	};
	'roles.sync': {
		GET: (params: RoleSyncProps) => ({
			roles: {
				update: IRole[];
				remove: IRole[];
			};
		});
	};
	'roles.create': {
		POST: (params: RoleCreateProps) => ({
			role: IRole;
		});
	};

	'roles.addUserToRole': {
		POST: (params: { roleId: string; userId: string }) => ({
			role: IRole;
		});
	};

	'roles.getUsersInRole': {
		GET: (params: { roomId: string; role: string; offset: number; count: number }) => ({
			users: IUser[];
			total: number;
		});
	};

	'roles.update': {
		POST: (role: RoleUpdateProps) => ({
			role: IRole;
		});
	};

	'roles.delete': {
		POST: (prop: RoleDeleteProps) => void;
	};

	'roles.removeUserFromRole': {
		POST: (props: RoleRemoveUserFromRoleProps) => ({
			role: IRole;
		});
	};
};

import { Roles, Users } from '../../../models/server/raw';

export const getLevelByRolesAsync = (roles) => Roles.getLevel(roles);
export const getUserLevelAsync = async ({ roles }) => getLevelByRolesAsync(roles);
export const getUserLevelAsyncById = async (uid) => {
	const user = await Users.getRoles(uid);
	return getUserLevelAsync(user);
};

export const getLevelByRoles = (roles) => Promise.await(getLevelByRolesAsync(roles));
export const getLevelByRole = (role) => Promise.await(getLevelByRolesAsync([role]));
export const getUserLevelById = (uid) => Promise.await(getUserLevelAsyncById(uid));
export const getUserLevelUser = (user) => Promise.await(getUserLevelAsync(user));

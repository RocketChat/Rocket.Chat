export interface IModerationService {
	// 	protected name = 'moderation';
	// resets the roles of all users
	resetUserRoles(roles: string[]): Promise<void>;
	// adds permissions to a role
	addPermissionsToRole(roleName: string, permissions: string[]): Promise<void>;
}

export interface IAuthorization {
	hasPermission(permission: string, user: string): boolean;
	hasPermission2(permission: string, user: string, bla: number): number;
	prop?: string;
}

import type { UserStatus } from './UserStatus';

export interface IUserSessionConnection {
	id: string;
	instanceId: string;
	status: UserStatus;
	_createdAt: Date;
	_updatedAt: Date;
}

export interface IUserSession {
	_id: string;
	connections: IUserSessionConnection[];
}

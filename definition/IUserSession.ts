import { USER_STATUS } from './UserStatus';

export interface IUserSessionConnection {
	id: string;
	instanceId: string;
	status: USER_STATUS;
	_createdAt: Date;
	_updatedAt: Date;
}

export interface IUserSession {
	_id: string;
	connections: IUserSessionConnection[];
}

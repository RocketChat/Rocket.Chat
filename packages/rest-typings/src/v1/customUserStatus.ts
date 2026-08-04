import type { ICustomUserStatus } from '@rocket.chat/core-typings';

export type CustomUserStatusEndpoints = {
	'/v1/custom-user-status.create': {
		POST: (params: { name: string; statusType?: string }) => {
			customUserStatus: ICustomUserStatus;
		};
	};
	'/v1/custom-user-status.delete': {
		POST: (params: { customUserStatusId: string }) => void;
	};
	'/v1/custom-user-status.update': {
		POST: (params: { _id: string; name?: string; statusType?: string }) => {
			customUserStatus: ICustomUserStatus;
		};
	};
};

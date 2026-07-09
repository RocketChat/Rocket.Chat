import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus as UserStatusType } from '@rocket.chat/core-typings';

export type UserStatusInitialValues = {
	statusText: string;
	statusType: IUser['status'];
	statusDuration: string;
	statusCustomDate: string;
	statusCustomTime: string;
};

export const getUserStatusInitialValues = (user: IUser | null, initialStatusText?: string) => {
	const initialExpiration = user?.statusExpiresAt && new Date(user.statusExpiresAt) > new Date() ? new Date(user.statusExpiresAt) : null;
	const initialDate = initialExpiration ?? new Date();

	return {
		statusText: user?.statusText ?? initialStatusText ?? '',
		statusType:
			user?.status === UserStatusType.AWAY ? (user?.statusDefault ?? UserStatusType.ONLINE) : (user?.status ?? UserStatusType.ONLINE),
		statusDuration: initialExpiration ? 'custom' : '',
		statusCustomDate: initialDate.toLocaleDateString('en-CA'),
		statusCustomTime: initialDate.toTimeString().slice(0, 5),
	};
};

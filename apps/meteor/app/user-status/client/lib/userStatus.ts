import { UserStatus } from '@rocket.chat/core-typings';

export const STATUS_MAP = Object.values(UserStatus);

type Status = {
	name: string;
	id: string;
	statusType: UserStatus;
	localizeName: boolean;
};

type CustomStatus = {
	name: string;
	id: string;
	statusType: UserStatus;
	localizeName: boolean;
};

type UserStatusTypes = {
	packages: {
		customUserStatus: {
			list: CustomStatus[];
		};
	};
	list: {
		[status: string]: Status | CustomStatus;
	};
};

export const userStatus: UserStatusTypes = {
	packages: {
		customUserStatus: {
			list: [],
		}
	},

	list: {
		online: {
			name: UserStatus.ONLINE,
			localizeName: true,
			id: UserStatus.ONLINE,
			statusType: UserStatus.ONLINE,
		},
		away: {
			name: UserStatus.AWAY,
			localizeName: true,
			id: UserStatus.AWAY,
			statusType: UserStatus.AWAY,
		},
		busy: {
			name: UserStatus.BUSY,
			localizeName: true,
			id: UserStatus.BUSY,
			statusType: UserStatus.BUSY,
		},
		offline: {
			name: UserStatus.OFFLINE,
			localizeName: true,
			id: UserStatus.OFFLINE,
			statusType: UserStatus.OFFLINE,
		},
	},
};


import { UserStatus } from '@rocket.chat/core-typings';

type Status = {
	name: string;
	localizeName: boolean;
	id: string;
	statusType: UserStatus;
};

type UserStatusTypes = {
	packages: any;
	list: {
		[status: string]: Status;
	};
};

export const userStatus: UserStatusTypes = {
	packages: {
		base: {
			render(html: string): string {
				return html;
			},
		},
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
} as const;

export enum UserStatus {
	ONLINE = 'online',
	AWAY = 'away',
	OFFLINE = 'offline',
	BUSY = 'busy',
	DISABLED = 'disabled',
}

export const UserStatusMap = [UserStatus.OFFLINE, UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.DISABLED];

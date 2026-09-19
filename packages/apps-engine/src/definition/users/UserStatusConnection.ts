/**
 * What the user's own connections report, as opposed to the presence
 * `IUser.status` shows other people.
 */
export enum UserStatusConnection {
	OFFLINE = 'offline',
	ONLINE = 'online',
	AWAY = 'away',
	BUSY = 'busy',
	INVISIBLE = 'invisible',
	/** This happens for livechat users and rocket.cat. */
	UNDEFINED = 'undefined',
}

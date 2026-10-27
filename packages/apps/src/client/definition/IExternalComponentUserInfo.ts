import type { IUser } from '@rocket.chat/apps-engine/definition/users';

type ClientUserInfo = Pick<IUser, 'id' | 'username'>;

/**
 * Represents the user's information returned to
 * the external component.
 */
export interface IExternalComponentUserInfo extends ClientUserInfo {
	/**
	 * the avatar URL of the Rocket.Chat user
	 */
	avatarUrl: string;
}

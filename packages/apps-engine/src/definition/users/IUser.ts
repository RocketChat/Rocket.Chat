import type { FederationUserLookup } from '../federation';
import type { IUserEmail } from './IUserEmail';
import type { IUserSettings } from './IUserSettings';
import type { UserStatusConnection } from './UserStatusConnection';
import type { UserType } from './UserType';

/**
 * A workspace account, as `IUserRead` returns it.
 *
 * Not everyone Rocket.Chat talks to is one of these: a Livechat visitor is an
 * `IVisitor` instead.
 */
export interface IUser {
	/** The user's identifier. */
	id: string;
	/** The user's username, unique across the workspace. */
	username: string;
	/** The user's email addresses, the first one being the primary. */
	emails: Array<IUserEmail>;
	/** What kind of account this is: a person, a bot, or an App's own user. */
	type: UserType;
	/** Whether the account may be used. A deactivated account cannot log in. */
	isEnabled: boolean;
	/** The user's display name. */
	name: string;
	/** The roles the user holds workspace-wide. */
	roles: Array<string>;
	/** What the user wrote about themselves. */
	bio?: string;
	/** The presence other users see. */
	status: string;
	/** The presence the user's own connections report. */
	statusConnection: UserStatusConnection;
	/** The message the user set alongside their presence. */
	statusText?: string;
	/** The presence to return to once the current one lapses. */
	statusDefault?: string;
	/** What set the current presence: Rocket.Chat, an integration, or the user. */
	statusSource?: 'internal' | 'external' | 'manual';
	/** When the current presence lapses back to `statusDefault`. */
	statusExpiresAt?: Date;
	/** The identifier of the preset the current presence came from. */
	statusId?: string;
	/** The user's time zone, as an offset from UTC in hours. */
	utcOffset: number;
	/** When the account was created. */
	createdAt: Date;
	/** When the account last changed. */
	updatedAt: Date;
	/** When the user last logged in. */
	lastLoginAt: Date;
	/** The user's own preferences. */
	settings?: IUserSettings;
	/** The App this account belongs to, when it is an App's own user. */
	appId?: string;
	/** The user's extension on the workspace's telephony provider. */
	sipExtension?: string;
	/** Whether the account lives on another server. */
	isFederated?: boolean;
	/** Where a federated account lives. */
	federation?: FederationUserLookup;
	/** The values the user filled into the workspace's custom profile fields. */
	customFields?: { [key: string]: any };
}

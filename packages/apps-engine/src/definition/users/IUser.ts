import type { FederationUserLookup } from '../federation';
import type { IUserEmail } from './IUserEmail';
import type { IUserMediaCallDevice } from './IUserMediaCallDevice';
import type { IUserSettings } from './IUserSettings';
import type { UserStatusConnection } from './UserStatusConnection';
import type { UserType } from './UserType';

export interface IUser {
	id: string;
	username: string;
	emails: Array<IUserEmail>;
	type: UserType;
	isEnabled: boolean;
	name: string;
	roles: Array<string>;
	bio?: string;
	status: string;
	statusConnection: UserStatusConnection;
	statusText?: string;
	statusDefault?: string;
	statusSource?: 'internal' | 'external' | 'manual';
	statusExpiresAt?: Date;
	statusId?: string;
	utcOffset: number;
	createdAt: Date;
	updatedAt: Date;
	lastLoginAt: Date;
	settings?: IUserSettings;
	appId?: string;
	sipExtension?: string;
	/** Set when the user takes media calls on an external device instead of Rocket.Chat. */
	mediaCallDevice?: IUserMediaCallDevice;
	isFederated?: boolean;
	federation?: FederationUserLookup;
	customFields?: { [key: string]: any };
}

import type { InsertionModel } from '@rocket.chat/model-typings';
import type { IUser } from '@rocket.chat/core-typings';

export type UserDocOptions = {
	username?: string;
	email?: string;
	password?: string | { algorithm: string; digest: string };
	name?: string;
	reason?: string;

	joinDefaultChannels?: boolean;
	joinDefaultChannelsSilenced?: boolean;
	isGuest?: boolean;
	globalRoles?: string[];

	profile?: {
		name?: string;
		email?: string;
	} & (
		| { name?: string }
		| { firstName?: string; lastName?: string }
		| {
				firstName?: { preferredLocale: { language: string; country: string }; localized: Record<string, string> };
				lastName?: { localized: Record<string, string> };
		  }
	);
};

export type CreateUserOptions = UserDocOptions & ({ username: string } | { email: string });

export interface IUserService {
	hashPassword(password: string | { algorithm: string; digest: string }): Promise<string>;
	create(options: UserDocOptions, doc: Partial<InsertionModel<IUser>>): Promise<IUser['_id']>;
	createWithPassword(options: CreateUserOptions): Promise<IUser['_id']>;
}

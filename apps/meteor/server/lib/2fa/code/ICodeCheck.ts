import type { IUser } from '@rocket.chat/core-typings';

/** The user fields the 2FA checks read; `getUserForCheck` projects exactly these. */
export type TwoFactorUser = Pick<IUser, '_id' | 'username' | 'emails' | 'language' | 'createdAt' | 'services'>;

export interface IProcessInvalidCodeResult {
	codeGenerated: boolean;
	codeExpires?: Date;
	emailOrUsername?: string;
}

export interface ICodeCheck {
	readonly name: string;

	isEnabled(user: TwoFactorUser, force?: boolean): boolean;

	verify(user: TwoFactorUser, code: string, force?: boolean): Promise<boolean>;

	processInvalidCode(user: TwoFactorUser): Promise<IProcessInvalidCodeResult>;

	maxFaildedAttemtpsReached(user: TwoFactorUser): Promise<boolean>;
}

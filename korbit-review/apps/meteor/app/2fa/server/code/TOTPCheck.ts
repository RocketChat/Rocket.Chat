import type { IUser } from '@rocket.chat/core-typings';

import type { ICodeCheck, IProcessInvalidCodeResult } from './ICodeCheck';
import { settings } from '../../../settings/server';
import { TOTP } from '../lib/totp';

export class TOTPCheck implements ICodeCheck {
	public readonly name = 'totp';

	public isEnabled(user: IUser): boolean {
		if (!settings.get('Accounts_TwoFactorAuthentication_By_TOTP_Enabled')) {
			return false;
		}

		return user.services?.totp?.enabled === true;
	}

	public async verify(user: IUser, code: string): Promise<boolean> {
		if (!this.isEnabled(user)) {
			return false;
		}

		if (!user.services?.totp?.secret) {
			return false;
		}

		return TOTP.verify({
			secret: user.services?.totp?.secret,
			token: code,
			userId: user._id,
			backupTokens: user.services?.totp?.hashedBackup,
		});
	}

	public async processInvalidCode(): Promise<IProcessInvalidCodeResult> {
		// Nothing to do
		return {
			codeGenerated: false,
		};
	}

	public async maxFaildedAttemtpsReached(_user: IUser): Promise<boolean> {
		return false;
	}
}

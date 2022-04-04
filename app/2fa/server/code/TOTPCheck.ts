import { TOTP } from '../lib/totp';
import { IUser } from '../../../../definition/IUser';
import { settings } from '../../../settings/server';
import { ICodeCheck, IProcessInvalidCodeResult } from './ICodeCheck';

export class TOTPCheck implements ICodeCheck {
	public readonly name = 'totp';

	public isEnabled(user: IUser): boolean {
		if (!settings.get('Accounts_TwoFactorAuthentication_By_TOTP_Enabled')) {
			return false;
		}

		return user.services?.totp?.enabled === true;
	}

	public verify(user: IUser, code: string): boolean {
		if (!this.isEnabled(user)) {
			return false;
		}

		return TOTP.verify({
			secret: user.services?.totp?.secret,
			token: code,
			userId: user._id,
			backupTokens: user.services?.totp?.hashedBackup,
		});
	}

	public processInvalidCode(): IProcessInvalidCodeResult {
		// Nothing to do
		return {
			codeGenerated: false,
		};
	}
}

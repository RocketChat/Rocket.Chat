import { TOTP } from '../lib/totp';
import { IUser } from '../../../../definition/IUser';
import { settings } from '../../../settings/server';
import { ICodeCheck, IProcessInvalidCodeResult } from './ICodeCheck';

export class TOTPCheck implements ICodeCheck {
	public readonly name = 'totp';

	public isEnabled(user: IUser): boolean {
		if (!settings.get('Accounts_TwoFactorAuthentication_Enabled')) {
			return false;
		}

		// #ToDo: re-implement this code
		const currentLoginIsByTwoFactor = false;
		// const currentLoginIsByTwoFactor = login.methodArguments && login.methodArguments[0] && login.methodArguments[0].totp;
		const twoFactorEnabledToUser = user.services?.totp?.enabled === true;
		if (!settings.get('Accounts_TwoFactorAuthentication_Enabled') || (!currentLoginIsByTwoFactor && !twoFactorEnabledToUser)) {
			return;
		}

		return user.services?.totp?.enabled === true;

		// if (currentLoginIsByTwoFactor && !twoFactorEnabledToUser) {
		// 	throw new Meteor.Error('totp-disabled', 'You do not have 2FA login enabled for your user');
		// }
		// if (login.type === 'password' && twoFactorEnabledToUser && !currentLoginIsByTwoFactor) {
		// 	throw new Meteor.Error('totp-required', 'TOTP Required');
		// }
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

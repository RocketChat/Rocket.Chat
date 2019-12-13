import { TOTP } from '../lib/totp';
import { IUser } from '../../../../definition/IUser';
import { ICodeCheck } from './ICodeCheck';

export class TOTPCheck implements ICodeCheck {
	public isEnabled(user: IUser): boolean {
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

	public processInvalidCode(): void {
		// Nothing to do
	}
}

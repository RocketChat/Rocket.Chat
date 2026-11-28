import type { ICodeCheck, IProcessInvalidCodeResult, TwoFactorUser } from './ICodeCheck';
import { settings } from '../../../settings';
import { compareUserPassword } from '../../compareUserPassword';

export class PasswordCheckFallback implements ICodeCheck {
	public readonly name = 'password';

	public isEnabled(user: TwoFactorUser, force: boolean): boolean {
		if (force) {
			return true;
		}
		// TODO: Remove this setting for version 4.0 forcing the
		// password fallback for who has password set.
		if (settings.get('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback')) {
			return user.services?.password?.bcrypt != null;
		}
		return false;
	}

	public async verify(user: TwoFactorUser, code: string, force: boolean): Promise<boolean> {
		if (!this.isEnabled(user, force)) {
			return false;
		}

		return compareUserPassword(user, { sha256: code });
	}

	public async processInvalidCode(): Promise<IProcessInvalidCodeResult> {
		return {
			codeGenerated: false,
		};
	}

	public async maxFaildedAttemtpsReached(_user: TwoFactorUser): Promise<boolean> {
		return false;
	}
}

import { Accounts } from 'meteor/accounts-base';

import { settings } from '../../../settings/server';
import { ICodeCheck, IProcessInvalidCodeResult } from './ICodeCheck';
import { IUser } from '../../../../definition/IUser';

export class PasswordCheckFallback implements ICodeCheck {
	public readonly name = 'password';

	public isEnabled(user: IUser): boolean {
		// TODO: Remove this setting for version 4.0 forcing the
		// password fallback for who has password set.
		if (settings.get('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback')) {
			return user.services?.password?.bcrypt != null;
		}
		return false;
	}

	public verify(user: IUser, code: string): boolean {
		if (!this.isEnabled(user)) {
			return false;
		}

		const passCheck = Accounts._checkPassword(user, {
			digest: code.toLowerCase(),
			algorithm: 'sha-256',
		});

		if (passCheck.error) {
			return false;
		}

		return true;
	}

	public processInvalidCode(): IProcessInvalidCodeResult {
		return {
			codeGenerated: false,
		};
	}
}

import { Accounts } from 'meteor/accounts-base';
import type { IUser } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';
import type { ICodeCheck, IProcessInvalidCodeResult } from './ICodeCheck';

export class PasswordCheckFallback implements ICodeCheck {
	public readonly name = 'password';

	public isEnabled(user: IUser, force: boolean): boolean {
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

	public verify(user: IUser, code: string, force: boolean): boolean {
		if (!this.isEnabled(user, force)) {
			return false;
		}

		const passCheck = Accounts._checkPassword(user as Meteor.User, {
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

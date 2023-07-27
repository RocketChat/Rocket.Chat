import type { IUser } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';

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

	public async verify(user: IUser, code: string, force: boolean): Promise<boolean> {
		if (!this.isEnabled(user, force)) {
			return false;
		}

		const passCheck = await Accounts._checkPasswordAsync(user as Meteor.User, {
			digest: code.toLowerCase(),
			algorithm: 'sha-256',
		});

		if (passCheck.error) {
			return false;
		}

		return true;
	}

	public async processInvalidCode(): Promise<IProcessInvalidCodeResult> {
		return {
			codeGenerated: false,
		};
	}
}

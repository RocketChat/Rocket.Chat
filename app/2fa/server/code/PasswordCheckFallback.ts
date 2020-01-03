import { Accounts } from 'meteor/accounts-base';

import { ICodeCheck, IProcessInvalidCodeResult } from './ICodeCheck';
import { IUser } from '../../../../definition/IUser';

export class PasswordCheckFallback implements ICodeCheck {
	public readonly name = 'password';

	public isEnabled(user: IUser): boolean {
		return user.services?.password?.bcrypt != null;
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

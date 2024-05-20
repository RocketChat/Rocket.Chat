import { ServiceClass } from '@rocket.chat/core-services';
import type { IAccount, ILoginResult } from '@rocket.chat/core-services';
import { Settings } from '@rocket.chat/models';

import { loginViaResume } from './lib/loginViaResume';
import { loginViaUsername } from './lib/loginViaUsername';
import { removeSession } from './lib/removeSession';

const ACCOUNTS_DEFAULT_LOGIN_EXPIRATION = 90;

export class Account extends ServiceClass implements IAccount {
	protected name = 'accounts';

	private loginExpiration = 90;

	constructor() {
		super();

		this.onEvent('watch.settings', async ({ clientAction, setting }): Promise<void> => {
			if (clientAction === 'removed') {
				return;
			}
			const { _id, value } = setting;
			if (_id !== 'Accounts_LoginExpiration') {
				return;
			}
			if (typeof value === 'number' && !Number.isNaN(value)) {
				this.loginExpiration = value;
			} else {
				this.loginExpiration = ACCOUNTS_DEFAULT_LOGIN_EXPIRATION;
			}
		});
	}

	async login({ resume, user, password }: { resume: string; user: { username: string }; password: string }): Promise<false | ILoginResult> {
		if (resume) {
			return loginViaResume(resume, this.loginExpiration);
		}

		if (user && password) {
			return loginViaUsername(user, password, this.loginExpiration);
		}

		return false;
	}

	async logout({ userId, token }: { userId: string; token: string }): Promise<void> {
		return removeSession(userId, token);
	}

	async started(): Promise<void> {
		const expiry = await Settings.findOne({ _id: 'Accounts_LoginExpiration' }, { projection: { value: 1 } });
		if (expiry?.value && typeof expiry.value === 'number' && !Number.isNaN(expiry.value)) {
			this.loginExpiration = expiry.value;
		} else {
			this.loginExpiration = ACCOUNTS_DEFAULT_LOGIN_EXPIRATION;
		}
	}
}

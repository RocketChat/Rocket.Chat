import { Settings } from '@rocket.chat/models';

import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import type { IAccount, ILoginResult } from '../../../../apps/meteor/server/sdk/types/IAccount';
import { removeSession } from './lib/removeSession';
import { loginViaResume } from './lib/loginViaResume';
import { loginViaUsername } from './lib/loginViaUsername';

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
			if (typeof value === 'number') {
				this.loginExpiration = value;
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
		if (expiry?.value) {
			this.loginExpiration = expiry.value as number;
		}
	}
}

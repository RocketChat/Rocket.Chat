import { ServiceClass } from '@rocket.chat/core-services';
import type { IAccount, ILoginResult } from '@rocket.chat/core-services';
import { Settings } from '@rocket.chat/models';
import { getLoginExpirationInDays } from '@rocket.chat/tools';

import { loginViaResume } from './lib/loginViaResume';
import { loginViaUsername } from './lib/loginViaUsername';
import { removeSession } from './lib/removeSession';

export class Account extends ServiceClass implements IAccount {
	protected name = 'accounts';

	private loginExpiration = 90;

	constructor() {
		super();

		this.onSettingChanged('Accounts_LoginExpiration', async ({ setting }): Promise<void> => {
			const { value } = setting;

			this.loginExpiration = getLoginExpirationInDays(value as number);
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

	override async started(): Promise<void> {
		const expiry = await Settings.findOne({ _id: 'Accounts_LoginExpiration' }, { projection: { value: 1 } });

		this.loginExpiration = getLoginExpirationInDays(expiry?.value as number);
	}
}

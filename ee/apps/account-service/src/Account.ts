import { ServiceClass, Settings } from '@rocket.chat/core-services';
import type { IAccount, ILoginResult } from '@rocket.chat/core-services';
import { getLoginExpirationInDays } from '@rocket.chat/tools';

import { loginViaResume } from './lib/loginViaResume.js';
import { removeSession } from './lib/removeSession.js';

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

	async login({ resume }: { resume: string }): Promise<false | ILoginResult> {
		if (resume) {
			return loginViaResume(resume, this.loginExpiration);
		}

		return false;
	}

	async logout({ userId, token }: { userId: string; token: string }): Promise<void> {
		return removeSession(userId, token);
	}

	override async started(): Promise<void> {
		const expiry = await Settings.get<number>('Accounts_LoginExpiration');

		this.loginExpiration = getLoginExpirationInDays(expiry);
	}
}

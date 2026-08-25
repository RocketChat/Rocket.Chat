import { ServiceClass, Settings } from '@rocket.chat/core-services';
import type { IAccount, ILoginResult } from '@rocket.chat/core-services';
import { getLoginExpirationInDays, primeOnce } from '@rocket.chat/tools';

import { loginViaResume } from './lib/loginViaResume';
import { removeSession } from './lib/removeSession';

export class Account extends ServiceClass implements IAccount {
	protected name = 'accounts';

	private loginExpiration?: number;

	/**
	 * Read on first login instead of in `started()`: the settings service lives in
	 * another process and is not necessarily reachable while this one boots, and an
	 * expiration that quietly fell back to a default would keep sessions alive past
	 * their configured lifetime.
	 */
	private primeLoginExpiration = primeOnce(async () => {
		this.loginExpiration = getLoginExpirationInDays(await Settings.get<number>('Accounts_LoginExpiration'));

		return this.loginExpiration;
	});

	constructor() {
		super();

		this.onSettingChanged('Accounts_LoginExpiration', async ({ setting }): Promise<void> => {
			const { value } = setting;

			this.loginExpiration = getLoginExpirationInDays(value as number);
		});
	}

	async login({ resume }: { resume: string }): Promise<false | ILoginResult> {
		if (resume) {
			return loginViaResume(resume, this.loginExpiration ?? (await this.primeLoginExpiration()));
		}

		return false;
	}

	async logout({ userId, token }: { userId: string; token: string }): Promise<void> {
		return removeSession(userId, token);
	}
}

import { Emitter } from '@rocket.chat/emitter';

import type { ClientStream } from './ClientStream';

export interface Account
	extends Emitter<{
		uid: string | undefined;
		user: Record<string, unknown> | undefined;
	}> {
	uid?: string;
	user?: Record<string, unknown>;
	loginWithPassword(username: string, password: string): Promise<void>;
	loginWithToken(token: string): Promise<{
		id: string;
		token: string;
		tokenExpires: Date;
	}>;
	logout(): Promise<void>;
}

export class AccountImpl
	extends Emitter<{
		uid: string | undefined;
		user: {
			id: string;
			username?: string;
			token?: string;
			tokenExpires?: Date;
		};
	}>
	implements Account
{
	uid?: string;

	user?: { id: string; username?: string; token?: string; tokenExpires?: Date };

	constructor(private readonly client: ClientStream) {
		super();
		console.log('CONSTRUCTOR');
		this.client.on('connected', () => {
			console.log('WHYYYYYYYYYYY');

			if (this.user?.token) {
				this.loginWithToken(this.user.token);
			}
		});

		client.onCollection('users', (data) => {
			if (data.collection !== 'users') {
				return;
			}

			if (!('fields' in data) || !(data.fields && 'username' in data.fields)) {
				return;
			}

			this.user = {
				...this.user,
				id: data.id,
				username: data.fields.username,
			};
			this.emit('user', this.user);
		});
	}

	private saveCredentials(id: string, token: string, tokenExpires: string) {
		this.user = {
			...this.user,
			token,
			tokenExpires: new Date(tokenExpires),
			id,
		};
		this.uid = id;
		this.emit('uid', this.uid);
		this.emit('user', this.user);
	}

	async loginWithPassword(username: string, password: string): Promise<void> {
		const {
			id,
			token: resultToken,
			tokenExpires: { $date },
		} = await this.client.callAsyncWithOptions(
			'login',
			{
				wait: true,
			},
			{
				user: { username },
				password: { digest: password, algorithm: 'sha-256' },
			},
		);

		this.saveCredentials(id, resultToken, $date);
	}

	async loginWithToken(token: string) {
		const result = await this.client.callAsyncWithOptions(
			'login',
			{
				wait: true,
			},
			{
				resume: token,
			},
		);

		const {
			id,
			token: resultToken,
			tokenExpires: { $date },
		} = result;
		this.saveCredentials(id, resultToken, $date);

		return result;
	}

	async logout(): Promise<void> {
		await this.client.callAsyncWithOptions('logout', {
			wait: true,
		});
		this.uid = undefined;
		this.emit('uid', this.uid);
	}
}

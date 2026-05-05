import { Emitter } from '@rocket.chat/emitter';

import type { ClientStream } from './ClientStream';
import { LoginCancelledError } from './LoginCancelledError';

type User = {
	id: string;
	username?: string;
	token?: string;
	tokenExpires?: Date;
} & Record<string, unknown>;

type AccountEvents = {
	uid: string | undefined;
	user?: User;
};

export interface Account extends Emitter<AccountEvents> {
	uid?: string;
	user?: User;
	loginWithPassword(username: string, password: string): Promise<void>;
	loginWithToken(token: string): Promise<{
		id: string;
		token: string;
		tokenExpires: Date;
	}>;
	logout(): Promise<void>;
	onLogin(fn: () => void): () => void;
	onLogout(fn: () => void): () => void;
}

export { LoginCancelledError };

export class AccountImpl extends Emitter<AccountEvents> implements Account {
	uid?: string;

	user?: { id: string; username?: string; token?: string; tokenExpires?: Date };

	constructor(private readonly client: ClientStream) {
		super();

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

	// `onLogin`/`onLogout` track transitions of `uid` (undefined↔string) so any
	// path that ends with the SDK's `uid` populated — `saveCredentials` from
	// loginWithPassword/loginWithToken, or external sync via `account.uid = ...`
	// followed by `emit('uid', ...)` — fires the right callback. Avoids needing
	// dedicated `login`/`logout` events that every caller would have to remember
	// to emit.
	onLogin(fn: () => void): () => void {
		let lastUid = this.uid;
		return this.on('uid', (uid) => {
			const wasLoggedOut = !lastUid;
			lastUid = uid;
			if (uid && wasLoggedOut) {
				fn();
			}
		});
	}

	onLogout(fn: () => void): () => void {
		let lastUid = this.uid;
		return this.on('uid', (uid) => {
			const wasLoggedIn = !!lastUid;
			lastUid = uid;
			if (!uid && wasLoggedIn) {
				fn();
			}
		});
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
		this.user = undefined;
		this.emit('uid', this.uid);
	}
}

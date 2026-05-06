import { Emitter } from '@rocket.chat/emitter';

import type { ClientStream } from './ClientStream';
import type { CredentialStorage } from './CredentialStorage';
import { LocalStorageCredentialStorage } from './CredentialStorage';
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

export type LoginCallback = (error: Error | undefined, result?: unknown) => void;

export type CallLoginMethodOptions = {
	methodName?: string;
	methodArguments?: unknown[];
	userCallback?: LoginCallback;
};

export interface Account extends Emitter<AccountEvents> {
	uid?: string;
	user?: User;
	storage: CredentialStorage;
	loginWithPassword(username: string, password: string): Promise<void>;
	loginWithToken(token: string): Promise<{
		id: string;
		token: string;
		tokenExpires: Date;
	}>;
	logout(): Promise<void>;
	onLogin(fn: () => void): () => void;
	onLogout(fn: () => void): () => void;
	callLoginMethod(options: CallLoginMethodOptions): void;
}

export { LoginCancelledError };

export class AccountImpl extends Emitter<AccountEvents> implements Account {
	uid?: string;

	user?: { id: string; username?: string; token?: string; tokenExpires?: Date };

	readonly storage: CredentialStorage;

	constructor(
		private readonly client: ClientStream,
		storage: CredentialStorage = new LocalStorageCredentialStorage(),
	) {
		super();
		this.storage = storage;

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

	// Mirrors `Accounts.callLoginMethod` from meteor/accounts-base. Dispatches
	// the `login` method with whatever shape callers pass in `methodArguments`
	// (resume token, password+totp, oauth credentialToken, saml, etc.) and
	// adopts the resulting credentials into `account.uid`/`user`/`token`.
	//
	// `userCallback` mirrors Meteor's signature — `(err)` on failure,
	// `(undefined, result)` on success — so existing call sites (oauth.ts,
	// password.ts, saml.ts, AuthenticationProvider) work without rewriting
	// the consumer side.
	callLoginMethod(options: CallLoginMethodOptions): void {
		const methodName = options.methodName ?? 'login';
		const methodArguments = options.methodArguments ?? [{}];
		const callback = options.userCallback;

		void (async () => {
			try {
				const result = (await this.client.callAsyncWithOptions(methodName, { wait: true }, ...methodArguments)) as
					| { id?: string; token?: string; tokenExpires?: { $date?: number } | Date }
					| undefined;

				if (result && typeof result === 'object' && typeof result.id === 'string' && typeof result.token === 'string') {
					this.saveCredentials(result.id, result.token, normalizeTokenExpires(result.tokenExpires));
				}

				callback?.(undefined, result);
			} catch (error) {
				callback?.(error as Error);
			}
		})();
	}
}

const normalizeTokenExpires = (expires: { $date?: number } | Date | undefined): string => {
	if (expires instanceof Date) {
		return String(expires.getTime());
	}
	if (typeof expires === 'object' && expires && typeof expires.$date === 'number') {
		return String(expires.$date);
	}
	return String(Date.now());
};

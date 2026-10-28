import { Emitter } from '@rocket.chat/emitter';

import type { ClientStream } from './ClientStream';

type User = {
	id: string;
	username?: string;
	token?: string;
	tokenExpires?: Date;
} & Record<string, unknown>;

export type LoginResult = {
	id: string;
	token: string;
	// A Date when the client decodes EJSON, the raw `{ $date }` otherwise.
	tokenExpires?: Date | { $date: number | string };
};

const toDate = (value: LoginResult['tokenExpires']): Date | undefined => {
	if (value === undefined || value instanceof Date) {
		return value;
	}
	const { $date } = value;
	return new Date(typeof $date === 'string' && /^\d+$/.test($date) ? Number($date) : $date);
};

type AccountEvents = {
	uid: string | undefined;
	user: User;
	emailVerificationLink: string;
	pageLoadLogin: unknown;
};

export interface Account extends Emitter<AccountEvents> {
	uid?: string;
	user?: User;
	loginWithPassword(username: string, password: string): Promise<void>;
	loginWithToken(token: string): Promise<{
		id: string;
		token: string;
		tokenExpires?: Date;
	}>;
	logout(): Promise<void>;
	/** Adopts credentials from a login made outside the SDK, as if the SDK had logged in. */
	setCredentials(credentials: LoginResult): void;
	/** Forgets the logged-in user locally without telling the server. */
	clearCredentials(): void;
	onLogin(fn: () => void): () => void;
	onLogout(fn: () => void): () => void;
	onEmailVerificationLink(fn: (token: string) => void): () => void;
	onPageLoadLogin(fn: (loginAttempt: unknown) => void): () => void;
}

export class AccountImpl extends Emitter<AccountEvents> implements Account {
	private _uid?: string;

	user?: { id: string; username?: string; token?: string; tokenExpires?: Date };

	get uid(): string | undefined {
		return this._uid;
	}

	// Setter emits only on transition so onLogin/onLogout fire once per login/logout,
	// not on every credential refresh. Direct writes from outside the SDK
	// (adoptAccountFromMeteorLoginResult, teardownAuthenticatedConnection) flow through
	// here and become the canonical login signal regardless of transport mode.
	set uid(value: string | undefined) {
		if (value === this._uid) return;
		this._uid = value;
		this.emit('uid', value);
	}

	constructor(private readonly client: ClientStream) {
		super();

		client.onCollection('users', (data) => {
			if (data.collection !== 'users') {
				return;
			}

			if (!('fields' in data) || !(data.fields && 'username' in data.fields)) {
				return;
			}

			// Meteor prefixes string ids that could pass for an ObjectID with '-' on the wire.
			const id = data.id.startsWith('-') ? data.id.slice(1) : data.id;

			// The logged-in user's document may arrive before the login result sets uid.
			if (this.uid !== undefined && id !== this.uid) {
				return;
			}

			this.user = {
				...this.user,
				id,
				username: data.fields.username,
			};
			this.emit('user', this.user);
		});
	}

	private saveCredentials({ id, token, tokenExpires }: LoginResult) {
		const expires = toDate(tokenExpires);
		this.user = {
			...this.user,
			token,
			tokenExpires: expires,
			id,
		};
		this.uid = id;
		this.emit('user', this.user);
		return { id, token, tokenExpires: expires };
	}

	async loginWithPassword(username: string, password: string): Promise<void> {
		const result: LoginResult = await this.client.callAsyncWithOptions(
			'login',
			{
				wait: true,
			},
			{
				user: { username },
				password: { digest: password, algorithm: 'sha-256' },
			},
		);

		this.saveCredentials(result);
	}

	async loginWithToken(token: string) {
		const result: LoginResult = await this.client.callAsyncWithOptions(
			'login',
			{
				wait: true,
			},
			{
				resume: token,
			},
		);

		return this.saveCredentials(result);
	}

	async logout(): Promise<void> {
		await this.client.callAsyncWithOptions('logout', {
			wait: true,
		});
		this.clearCredentials();
	}

	setCredentials(credentials: LoginResult): void {
		this.saveCredentials(credentials);
	}

	clearCredentials(): void {
		this.user = undefined;
		this.uid = undefined;
	}

	onLogin(fn: () => void): () => void {
		return this.on('uid', (uid) => {
			if (uid !== undefined) fn();
		});
	}

	onLogout(fn: () => void): () => void {
		return this.on('uid', (uid) => {
			if (uid === undefined) fn();
		});
	}

	// emailVerificationLink and pageLoadLogin have no native source in the SDK — the actual
	// events come from Meteor's accounts-base (URL hash routing for verification, pending
	// login attempts for OAuth). The bridge in apps/meteor/client/lib/sdk/ddpSdk.ts forwards
	// Meteor's events into this emitter; flag-OFF mode delegates directly via meteorBackedSdk.
	onEmailVerificationLink(fn: (token: string) => void): () => void {
		return this.on('emailVerificationLink', fn);
	}

	onPageLoadLogin(fn: (loginAttempt: unknown) => void): () => void {
		return this.on('pageLoadLogin', fn);
	}
}

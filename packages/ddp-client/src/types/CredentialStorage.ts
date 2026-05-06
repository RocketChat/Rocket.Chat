/**
 * Persistent storage for the SDK's auth credentials. Decouples the auth
 * lifecycle from the underlying storage backend so the same SDK works in
 * the browser (default), Node test envs (no-op), or environments that
 * choose to persist tokens elsewhere (sessionStorage, secure cookie, etc.).
 *
 * The default implementation (`LocalStorageCredentialStorage`) keeps the
 * Meteor key names so consumers like `client/meteor/overrides/ddpOverREST.ts`
 * which still read `localStorage.Meteor.loginToken` directly stay in sync,
 * and so existing user sessions don't get invalidated by the migration.
 */
export interface CredentialStorage {
	getToken(): string | null;
	getUserId(): string | null;
	getTokenExpires(): Date | null;
	setCredentials(userId: string, token: string, tokenExpires?: Date): void;
	/**
	 * Drop the persisted userId without touching the token or its expiry.
	 * Used by SAML SLO between issuing the logout request and the server
	 * confirming it — keeps the token around so a failed SLO can resume.
	 */
	clearUserId(): void;
	clear(): void;
}

export class LocalStorageCredentialStorage implements CredentialStorage {
	constructor(
		private readonly tokenKey = 'Meteor.loginToken',
		private readonly tokenExpiresKey = 'Meteor.loginTokenExpires',
		private readonly userIdKey = 'Meteor.userId',
	) {}

	private get storage(): Storage | null {
		if (typeof window === 'undefined') return null;
		return window.localStorage;
	}

	getToken(): string | null {
		return this.storage?.getItem(this.tokenKey) ?? null;
	}

	getUserId(): string | null {
		return this.storage?.getItem(this.userIdKey) ?? null;
	}

	getTokenExpires(): Date | null {
		const raw = this.storage?.getItem(this.tokenExpiresKey);
		if (!raw) return null;
		const ms = parseInt(raw, 10);
		return Number.isFinite(ms) ? new Date(ms) : null;
	}

	setCredentials(userId: string, token: string, tokenExpires?: Date): void {
		const s = this.storage;
		if (!s) return;
		s.setItem(this.userIdKey, userId);
		s.setItem(this.tokenKey, token);
		if (tokenExpires) {
			s.setItem(this.tokenExpiresKey, String(tokenExpires.getTime()));
		}
	}

	clearUserId(): void {
		this.storage?.removeItem(this.userIdKey);
	}

	clear(): void {
		const s = this.storage;
		if (!s) return;
		s.removeItem(this.tokenKey);
		s.removeItem(this.tokenExpiresKey);
		s.removeItem(this.userIdKey);
	}
}

/**
 * No-op storage used in environments without a `window.localStorage`
 * (Node tests / SSR). Reads return `null`, writes are silently dropped.
 */
export class MemoryCredentialStorage implements CredentialStorage {
	private token: string | null = null;

	private userId: string | null = null;

	private tokenExpires: Date | null = null;

	getToken(): string | null {
		return this.token;
	}

	getUserId(): string | null {
		return this.userId;
	}

	getTokenExpires(): Date | null {
		return this.tokenExpires;
	}

	setCredentials(userId: string, token: string, tokenExpires?: Date): void {
		this.userId = userId;
		this.token = token;
		this.tokenExpires = tokenExpires ?? null;
	}

	clearUserId(): void {
		this.userId = null;
	}

	clear(): void {
		this.token = null;
		this.userId = null;
		this.tokenExpires = null;
	}
}

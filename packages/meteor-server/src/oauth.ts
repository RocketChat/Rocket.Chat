import type { Collection, Document } from 'mongodb';

import { Meteor, MeteorError } from './meteor.ts';
import { MongoInternals } from './mongo.ts';

/**
 * Partial port of the meteor/oauth server package. The pending-credential
 * store is functional (same collection Meteor uses); the login-response
 * templates still need vendoring from meteor/oauth.
 */

type OAuthService = {
	serviceName: string;
	version: number;
	urls: unknown;
	handleOauthRequest: (query: Record<string, any>) => Promise<unknown> | unknown;
};

const registeredServices = new Map<string, OAuthService>();

const PENDING_CREDENTIALS_COLLECTION = 'meteor_oauth_pendingCredentials';

const pendingCredentials = (): Collection<Document> =>
	MongoInternals.defaultRemoteCollectionDriver().mongo.db.collection(PENDING_CREDENTIALS_COLLECTION);

const notImplemented = (member: string): never => {
	throw new Error(`OAuth.${member} is not implemented yet in @rocket.chat/meteor-server — vendor it from meteor/oauth`);
};

export const OAuth = {
	registerService(serviceName: string, version: number, urls: unknown, handleOauthRequest: OAuthService['handleOauthRequest']): void {
		if (registeredServices.has(serviceName)) {
			throw new Error(`Duplicate service: ${serviceName}`);
		}
		registeredServices.set(serviceName, { serviceName, version, urls, handleOauthRequest });
	},

	_unregisterService(serviceName: string): void {
		registeredServices.delete(serviceName);
	},

	serviceNames(): string[] {
		return [...registeredServices.keys()];
	},

	_getService(serviceName: string): OAuthService | undefined {
		return registeredServices.get(serviceName);
	},

	// Without the oauth-encryption package secrets are stored/returned as-is.
	openSecret<T>(maybeSecret: T, _userId?: string): T {
		return maybeSecret;
	},

	sealSecret<T>(plaintext: T): T {
		return plaintext;
	},

	openSecrets<T extends Record<string, any>>(config: T, userId?: string): T {
		const result: Record<string, any> = { ...config };
		for (const key of Object.keys(result)) {
			result[key] = OAuth.openSecret(result[key], userId);
		}
		return result as T;
	},

	_redirectUri(serviceName: string, _config?: unknown): string {
		return Meteor.absoluteUrl(`_oauth/${serviceName}`);
	},

	_checkRedirectUrlOrigin(redirectUrl: string): boolean {
		const rootUrl = process.env.ROOT_URL;
		return !rootUrl || !redirectUrl.startsWith(rootUrl);
	},

	async _storePendingCredential(key: string, credential: unknown, credentialSecret: string | null = null): Promise<void> {
		if (credential instanceof Error) {
			credential = storableError(credential);
		} else if (credential instanceof MeteorError) {
			credential = storableError(credential);
		}

		await pendingCredentials().updateOne(
			{ key },
			{
				$set: {
					key,
					credential,
					credentialSecret,
					createdAt: new Date(),
				},
			},
			{ upsert: true },
		);
	},

	async _retrievePendingCredential(key: string, credentialSecret: string | null = null): Promise<unknown> {
		const pendingCredential = await pendingCredentials().findOne({ key, credentialSecret });
		if (!pendingCredential) {
			return undefined;
		}

		await pendingCredentials().deleteOne({ _id: pendingCredential._id });

		if (pendingCredential.credential?.error) {
			return recreateError(pendingCredential.credential.error);
		}

		return OAuth.openSecret(pendingCredential.credential);
	},

	async retrieveCredential(credentialToken: string, credentialSecret: string): Promise<unknown> {
		return OAuth._retrievePendingCredential(credentialToken, credentialSecret);
	},

	_stateFromQuery(query: Record<string, string>): Record<string, any> | undefined {
		try {
			return JSON.parse(Buffer.from(query.state, 'base64').toString('utf8'));
		} catch {
			return undefined;
		}
	},

	_isCordovaFromQuery(query: Record<string, string>): boolean {
		try {
			return !!OAuth._stateFromQuery(query)?.isCordova;
		} catch {
			return false;
		}
	},

	get _endOfPopupResponseTemplate(): string {
		return notImplemented('_endOfPopupResponseTemplate');
	},

	get _endOfRedirectResponseTemplate(): string {
		return notImplemented('_endOfRedirectResponseTemplate');
	},

	_endOfLoginResponse(): never {
		return notImplemented('_endOfLoginResponse');
	},

	_storageTokenPrefix: 'Meteor.oauth.credentialSecret-',
};

// Errors are stored as plain objects (mirrors meteor/oauth storableError/recreateError)
const storableError = (error: Error) => ({ error: { message: error.message, ...(error as any).error && { error: (error as any).error } } });

const recreateError = (errorDoc: { message: string }): Error => new Error(errorDoc.message);

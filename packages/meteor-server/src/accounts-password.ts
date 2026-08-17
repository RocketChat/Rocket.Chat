import { compare as bcryptCompare, hash as bcryptHash } from 'bcrypt';
import type { Document, Filter, FindOptions } from 'mongodb';

import { Accounts } from './accounts-base.ts';
import { Meteor, MeteorError } from './meteor.ts';
import { SHA256 } from './sha.ts';

/**
 * Port of meteor/accounts-password (server) @ METEOR@3.4.1, limited to the
 * password login path Rocket.Chat depends on.
 *
 * COMPATIBILITY: the hashing scheme must not change — a plaintext password is
 * SHA256'd before bcrypt, and the client normally sends
 * `{ digest: SHA256(password), algorithm: 'sha-256' }` already. Existing
 * `services.password.bcrypt` hashes in the database depend on this exactly.
 *
 * Argon2 is not supported (Meteor's argon2 path is opt-in via
 * `Accounts._options.argon2Enabled` and Rocket.Chat does not enable it); an
 * argon2 hash is reported rather than silently failing the comparison.
 */

export type PasswordInput = string | { digest: string; algorithm: string };

/**
 * Extracts the string to be bcrypted. A plaintext string is SHA256'd first;
 * an object must carry a sha-256 digest.
 */
const getPasswordString = (password: PasswordInput): string => {
	if (typeof password === 'string') {
		return SHA256(password);
	}

	if (password.algorithm !== 'sha-256') {
		throw new Error("Invalid password hash algorithm. Only 'sha-256' is allowed.");
	}

	return password.digest;
};

export const hashPassword = async (password: PasswordInput): Promise<string> => {
	return bcryptHash(getPasswordString(password), Accounts._bcryptRounds());
};

const getUserPasswordHash = (user: Document): string | undefined => user.services?.password?.argon2 || user.services?.password?.bcrypt;

/** Extract the number of rounds used in the specified bcrypt hash */
const getRoundsFromBcryptHash = (hash?: string): number | undefined => {
	if (!hash) {
		return undefined;
	}
	const segments = hash.split('$');
	return segments.length > 2 ? parseInt(segments[2], 10) : undefined;
};

const isArgon = (hash?: string): boolean => !!hash?.startsWith('$argon2');

export const checkPasswordAsync = async (user: Document, password: PasswordInput): Promise<{ userId: string; error?: unknown }> => {
	const result: { userId: string; error?: unknown } = { userId: user._id as string };

	const formattedPassword = getPasswordString(password);
	const hash = getUserPasswordHash(user);

	if (isArgon(hash)) {
		throw new Error('User has an argon2 password hash, which @rocket.chat/meteor-server does not support');
	}

	const match = hash ? await bcryptCompare(formattedPassword, hash) : false;

	if (!match) {
		result.error = Accounts._handleError('Incorrect password', false);
		return result;
	}

	// The password checks out, but the stored hash uses different bcrypt
	// settings — rehash it in the background, as Meteor does.
	if (getRoundsFromBcryptHash(hash) !== Accounts._bcryptRounds()) {
		void updateUserPassword(user._id as string, { digest: formattedPassword, algorithm: 'sha-256' }).catch((err) =>
			Meteor._debug('Failed to upgrade password hash', err),
		);
	}

	return result;
};

const updateUserPassword = async (userId: string, password: PasswordInput): Promise<void> => {
	const hashed = await hashPassword(password);
	await Accounts.users.updateAsync(userId, {
		$set: { 'services.password.bcrypt': hashed },
		$unset: { 'services.password.argon2': 1 },
	} as any);
};

// The client sends { digest, algorithm }; other DDP clients may send plaintext
const isValidPasswordInput = (password: unknown): boolean => {
	if (typeof password === 'string') {
		return password.length <= ((Meteor.settings as any)?.packages?.accounts?.passwordMaxLength || 256);
	}
	const candidate = password as { digest?: unknown; algorithm?: unknown };
	return typeof candidate?.digest === 'string' && candidate.digest.length === 64 && candidate.algorithm === 'sha-256';
};

/** Port of Accounts._findUserByQuery, including the case-insensitive fallback */
const findUserByQuery = async (query: Record<string, any>, options?: FindOptions): Promise<Document | null> => {
	if (query.id) {
		return Accounts.users.findOneAsync(query.id, options);
	}

	let fieldName: string;
	let fieldValue: string;

	if (query.username) {
		fieldName = 'username';
		fieldValue = query.username;
	} else if (query.email) {
		fieldName = 'emails.address';
		fieldValue = query.email;
	} else {
		throw new Error("shouldn't happen (validation missed something)");
	}

	const user = await Accounts.users.findOneAsync({ [fieldName]: fieldValue } as Filter<Document>, options);
	if (user) {
		return user;
	}

	// Fall back to a case insensitive lookup; no match if it is ambiguous
	const candidates = await Accounts.users
		.find({ [fieldName]: new RegExp(`^${Meteor._escapeRegExp(fieldValue)}$`, 'i') } as Filter<Document>, { ...options, limit: 2 })
		.fetchAsync();

	return candidates.length === 1 ? candidates[0] : null;
};

Accounts._findUserByQuery = findUserByQuery;
Accounts.findUserByUsername = async (username: string, options?: FindOptions) => findUserByQuery({ username }, options);
Accounts.findUserByEmail = async (email: string, options?: FindOptions) => findUserByQuery({ email }, options);
Accounts._checkPasswordAsync = checkPasswordAsync;

Accounts.setPasswordAsync = async (userId: string, newPlaintextPassword: string, options: { logout?: boolean } = {}): Promise<void> => {
	const { logout = true } = options;

	const hashed = await hashPassword(newPlaintextPassword);
	const update: Document = {
		$set: { 'services.password.bcrypt': hashed },
		$unset: { 'services.password.reset': 1, 'services.password.argon2': 1, ...(logout && { 'services.resume.loginTokens': 1 }) },
	};

	await Accounts.users.updateAsync(userId, update as any);
};

/**
 * Handler to login with a password (port of the accounts-password handler).
 *
 * Returns `undefined` when there is no password in the options so the next
 * handler gets a chance, matching Meteor.
 */
Accounts.registerLoginHandler('password', async (options: Record<string, any>) => {
	if (!options.password) {
		return undefined; // don't handle
	}

	if (!isValidPasswordInput(options.password)) {
		throw new MeteorError(400, 'Match failed');
	}

	const user = await findUserByQuery(options.user ?? {}, {
		projection: { _id: 1, services: 1 },
	});

	if (!user) {
		Accounts._handleError('User not found');
	}

	if (!getUserPasswordHash(user!)) {
		Accounts._handleError('User has no password set');
	}

	const result = await checkPasswordAsync(user!, options.password);

	// Added by accounts-2fa upstream; Rocket.Chat registers its own 'totp'
	// handler instead, so there is nothing to check here.
	return result;
});

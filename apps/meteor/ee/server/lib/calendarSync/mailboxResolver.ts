import type { IUser } from '@rocket.chat/core-typings';

export type MailboxSource = 'email' | 'custom-field';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resolves the Exchange mailbox address for a user. Returns null when the user
 * has no resolvable mailbox — callers must skip (and count) these users, never
 * fail the batch.
 *
 * With the default `email` source only *verified* addresses are used: an
 * unverified address could point at someone else's mailbox and leak their
 * calendar into this user's account.
 */
export function resolveMailbox(
	user: Pick<IUser, 'emails' | 'customFields'>,
	source: MailboxSource,
	customFieldName?: string,
): string | null {
	if (source === 'custom-field') {
		if (!customFieldName) {
			return null;
		}
		const value = user.customFields?.[customFieldName];
		return typeof value === 'string' && EMAIL_PATTERN.test(value.trim()) ? value.trim() : null;
	}

	const verified = user.emails?.find((email) => email.verified && EMAIL_PATTERN.test(email.address));
	return verified?.address ?? null;
}

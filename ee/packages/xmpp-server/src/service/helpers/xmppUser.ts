import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { domainOfJid, toBareJid } from './jid';

/**
 * Idempotently upserts a remote XMPP user as a local record. The username IS the
 * bare JID (`alice@remote.tld`). We set `federated: true` (so client remote-user
 * treatment applies) plus `xmppFederation`, but deliberately NOT `federation`,
 * keeping the user out of every Matrix code path (`isUserNativeFederated` stays false).
 *
 * `name` is the nick the user was last seen under; without one, the name already stored is kept.
 */
export async function createOrUpdateXMPPUser(options: { jid: string; name?: string }): Promise<IUser> {
	const jid = toBareJid(options.jid);
	const origin = domainOfJid(jid);

	const user = await Users.findOneAndUpdate(
		{ username: jid },
		{
			$set: {
				username: jid,
				...(options.name && { name: options.name }),
				type: 'user' as const,
				status: UserStatus.OFFLINE,
				active: true,
				roles: ['federated-external'],
				requirePasswordChange: false,
				federated: true,
				xmppFederation: { version: 1 as const, jid, origin },
				_updatedAt: new Date(),
			},
			$setOnInsert: {
				...(!options.name && { name: jid }),
				createdAt: new Date(),
			},
		},
		{
			upsert: true,
			returnDocument: 'after',
		},
	);

	if (!user) {
		throw new Error(`Failed to create or update XMPP user: ${jid}`);
	}

	return user;
}

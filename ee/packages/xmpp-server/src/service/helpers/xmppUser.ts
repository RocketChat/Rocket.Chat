import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { domainOfJid, toBareJid } from './jid';

/**
 * Idempotently upserts a remote XMPP user as a local record. The username IS the
 * bare JID (`alice@remote.tld`). We set `federated: true` (so client remote-user
 * treatment applies) plus `xmppFederation`, but deliberately NOT `federation`,
 * keeping the user out of every Matrix code path (`isUserNativeFederated` stays false).
 */
export async function createOrUpdateXMPPUser(options: { jid: string; name?: string }): Promise<IUser> {
	const jid = toBareJid(options.jid);
	const origin = domainOfJid(jid);
	const name = options.name || jid;

	const user = await Users.findOneAndUpdate(
		{ username: jid },
		{
			$set: {
				username: jid,
				name,
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
				createdAt: new Date(),
			},
		},
		{
			upsert: true,
			projection: { _id: 1, username: 1 },
			returnDocument: 'after',
		},
	);

	if (!user) {
		throw new Error(`Failed to create or update XMPP user: ${jid}`);
	}

	return user;
}

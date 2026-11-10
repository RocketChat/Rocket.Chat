import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { domainOfJid } from './jid';
import { normalizeUserBareJid } from '../../jid/normalize';

/** Creates or refreshes the record of the remote account `jid` names; throws for anything that names no remote account. */
export async function createOrUpdateXMPPUser(options: { jid: string; name?: string }): Promise<IUser> {
	const jid = normalizeUserBareJid(options.jid);

	const user = await Users.upsertXMPPUser(jid, domainOfJid(jid), options.name);

	if (!user) {
		throw new Error(`Failed to create or update XMPP user: ${jid}`);
	}

	return user;
}

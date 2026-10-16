import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { domainOfJid, toBareJid } from './jid';
import { InvalidJidError } from '../../errors';

/** Creates or refreshes the record of the remote account `jid` names; throws for anything that names no remote account. */
export async function createOrUpdateXMPPUser(options: { jid: string; name?: string }): Promise<IUser> {
	const jid = toBareJid(options.jid);
	const at = jid.lastIndexOf('@');
	if (at <= 0 || at === jid.length - 1) {
		throw new InvalidJidError(options.jid);
	}

	const user = await Users.upsertXMPPUser(jid, domainOfJid(jid), options.name);

	if (!user) {
		throw new Error(`Failed to create or update XMPP user: ${jid}`);
	}

	return user;
}

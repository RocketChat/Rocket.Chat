import type { IContact, IUser } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Contacts } from '@rocket.chat/models';

import { settings } from '../../../../server/settings';
import { normalizeE164 } from '../exchange/sync/contacts/normalizeE164';

export const resolveCallerContact = async (
	uid: IUser['_id'],
	number: string,
): Promise<Pick<IContact, '_id' | 'displayName'> | undefined> => {
	const source = License.hasModule('outlook-calendar') ? undefined : 'local';

	// No region: a caller id is keyed only when it carries its own country code, which is the global form
	// RFC 3966 asks for. Without one it is a local number, and the `phone-context` that would make it
	// unambiguous never survives the parse, so there is nothing to resolve it against but the text itself.
	const e164 = settings.get<boolean>('VoIP_TeamCollab_SIP_Integration_Normalize_Caller_Numbers') ? normalizeE164(number) : undefined;

	return (await Contacts.findOneByUserIdAndPhone(uid, e164 ? { e164 } : { raw: number }, source)) ?? undefined;
};

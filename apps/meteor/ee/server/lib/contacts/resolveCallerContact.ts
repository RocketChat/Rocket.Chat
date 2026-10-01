import type { IContact, IUser } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Contacts } from '@rocket.chat/models';

import { settings } from '../../../../server/settings';
import { normalizeE164 } from '../exchange/sync/contacts/normalizeE164';

export const resolveCallerContact = async (
	uid: IUser['_id'],
	number: string,
): Promise<Pick<IContact, '_id' | 'displayName'> | undefined> => {
	const e164 = normalizeE164(number, settings.get<string>('Exchange_Contacts_Default_Region') ?? '');

	if (!e164) {
		return undefined;
	}

	const contact = await Contacts.findOneByUserIdAndPhone(uid, e164, License.hasModule('outlook-calendar') ? undefined : 'local');

	return contact ?? undefined;
};

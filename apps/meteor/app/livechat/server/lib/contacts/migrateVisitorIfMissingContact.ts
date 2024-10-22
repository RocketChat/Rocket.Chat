import type { ILivechatVisitor, IOmnichannelSource, ILivechatContact } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { Livechat } from '../LivechatTyped';
import { getContactIdByVisitorId } from './getContactIdByVisitorId';
import { migrateVisitorToContactId } from './migrateVisitorToContactId';

export async function migrateVisitorIfMissingContact(
	visitorId: ILivechatVisitor['_id'],
	source: IOmnichannelSource,
): Promise<ILivechatContact['_id'] | null> {
	Livechat.logger.debug(`Detecting visitor's contact ID`);
	// Check if there is any contact already linking to this visitorId
	const contactId = await getContactIdByVisitorId(visitorId);
	if (contactId) {
		return contactId;
	}

	const visitor = await LivechatVisitors.findOneById(visitorId);
	if (!visitor) {
		throw new Error('Failed to migrate visitor data into Contact information: visitor not found.');
	}

	return migrateVisitorToContactId(visitor, source);
}

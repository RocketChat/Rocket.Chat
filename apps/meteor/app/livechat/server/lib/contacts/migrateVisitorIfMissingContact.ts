import type { ILivechatVisitor, IOmnichannelSource, ILivechatContact } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { livechatContactsLogger as logger } from '../logger';
import { getContactIdByVisitor } from './getContactIdByVisitor';
import { migrateVisitorToContactId } from './migrateVisitorToContactId';

export async function migrateVisitorIfMissingContact(
	visitorId: ILivechatVisitor['_id'],
	source: IOmnichannelSource,
): Promise<ILivechatContact['_id'] | null> {
	logger.debug(`Detecting visitor's contact ID`);
	// Check if there is any contact already linking to this visitorId and source
	const contactId = await getContactIdByVisitor({ visitorId, source });
	if (contactId) {
		return contactId;
	}

	const visitor = await LivechatVisitors.findOneById(visitorId);
	if (!visitor) {
		throw new Error('Failed to migrate visitor data into Contact information: visitor not found.');
	}

	return migrateVisitorToContactId({ visitor, source, requireRoom: false });
}

import type { ILivechatContact, ILivechatContactChannel } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts } from '@rocket.chat/models';

import { ContactMerger } from '../../../app/livechat/server/lib/contacts/ContactMerger';
import { mergeContacts } from '../../../app/livechat/server/lib/contacts/mergeContacts';
import { logger } from '../../app/livechat-enterprise/server/lib/logger';

export const runMergeContacts = async (_next: any, contactId: string, visitorId: string): Promise<ILivechatContact | null> => {
	const originalContact = await LivechatContacts.findOneById(contactId);
	if (!originalContact) {
		throw new Error('error-invalid-contact');
	}

	const channel = originalContact.channels?.find((channel: ILivechatContactChannel) => channel.visitorId === visitorId);
	if (!channel) {
		throw new Error('error-invalid-channel');
	}
	const similarContacts: ILivechatContact[] = await LivechatContacts.findSimilarVerifiedContacts(channel, contactId);

	if (!similarContacts.length) {
		return originalContact;
	}

	for await (const similarContact of similarContacts) {
		const fields = await ContactMerger.getAllFieldsFromContact(similarContact);
		await ContactMerger.mergeFieldsIntoContact(fields, originalContact);
	}

	const similarContactIds = similarContacts.map((c) => c._id);
	const { deletedCount } = await LivechatContacts.deleteMany({ _id: { $in: similarContactIds } });
	logger.info(
		`${deletedCount} contacts (ids: ${JSON.stringify(similarContactIds)}) have been deleted and merged with contact with id ${
			originalContact._id
		}`,
	);
	return LivechatContacts.findOneById(contactId);
};

mergeContacts.patch(runMergeContacts, () => License.hasModule('contact-id-verification'));

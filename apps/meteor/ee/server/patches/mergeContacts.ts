import type { ILivechatContact, ILivechatContactChannel, ILivechatContactVisitorAssociation } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatRooms } from '@rocket.chat/models';

import { isSameChannel } from '../../../app/livechat/lib/isSameChannel';
import { ContactMerger } from '../../../app/livechat/server/lib/contacts/ContactMerger';
import { mergeContacts } from '../../../app/livechat/server/lib/contacts/mergeContacts';
import { contactLogger as logger } from '../../app/livechat-enterprise/server/lib/logger';

export const runMergeContacts = async (
	_next: any,
	contactId: string,
	visitor: ILivechatContactVisitorAssociation,
): Promise<ILivechatContact | null> => {
	const originalContact = await LivechatContacts.findOneById(contactId);
	if (!originalContact) {
		throw new Error('error-invalid-contact');
	}

	const channel = originalContact.channels?.find((channel: ILivechatContactChannel) => isSameChannel(channel.visitor, visitor));
	if (!channel) {
		throw new Error('error-invalid-channel');
	}
	logger.debug(`Getting similar contacts for contact ${contactId}`);
	const similarContacts: ILivechatContact[] = await LivechatContacts.findSimilarVerifiedContacts(channel, contactId);

	if (!similarContacts.length) {
		logger.debug(`No similar contacts found for contact ${contactId}`);
		return originalContact;
	}

	logger.debug(`Start merging contact data for contact ${contactId}`);
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

	logger.debug(`Updating rooms with contact id ${contactId}`);
	await LivechatRooms.updateMany({ 'v.contactId': { $in: similarContactIds } }, { $set: { 'v.contactId': contactId } });

	return LivechatContacts.findOneById(contactId);
};

mergeContacts.patch(runMergeContacts, () => License.hasModule('contact-id-verification'));

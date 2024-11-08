import type { ILivechatContact, ILivechatContactChannel, ILivechatContactVisitorAssociation } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatRooms } from '@rocket.chat/models';
import type { ClientSession } from 'mongodb';

import { isSameChannel } from '../../../app/livechat/lib/isSameChannel';
import { ContactMerger } from '../../../app/livechat/server/lib/contacts/ContactMerger';
import { mergeContacts } from '../../../app/livechat/server/lib/contacts/mergeContacts';
import { logger } from '../../app/livechat-enterprise/server/lib/logger';

export const runMergeContacts = async (
	_next: any,
	contactId: string,
	visitor: ILivechatContactVisitorAssociation,
	session?: ClientSession,
): Promise<ILivechatContact | null> => {
	const originalContact = await LivechatContacts.findOneById(contactId, { session });
	if (!originalContact) {
		throw new Error('error-invalid-contact');
	}

	const channel = originalContact.channels?.find((channel: ILivechatContactChannel) => isSameChannel(channel.visitor, visitor));
	if (!channel) {
		throw new Error('error-invalid-channel');
	}
	const similarContacts: ILivechatContact[] = await LivechatContacts.findSimilarVerifiedContacts(channel, contactId, { session });

	if (!similarContacts.length) {
		return originalContact;
	}

	for await (const similarContact of similarContacts) {
		const fields = ContactMerger.getAllFieldsFromContact(similarContact);
		await ContactMerger.mergeFieldsIntoContact(fields, originalContact, undefined, session);
	}

	const similarContactIds = similarContacts.map((c) => c._id);
	const { deletedCount } = await LivechatContacts.deleteMany({ _id: { $in: similarContactIds } }, { session });
	logger.info(
		`${deletedCount} contacts (ids: ${JSON.stringify(similarContactIds)}) have been deleted and merged with contact with id ${
			originalContact._id
		}`,
	);

	await LivechatRooms.updateMany({ 'v.contactId': { $in: similarContactIds } }, { $set: { 'v.contactId': contactId } }, { session });

	return LivechatContacts.findOneById(contactId, { session });
};

mergeContacts.patch(runMergeContacts, () => License.hasModule('contact-id-verification'));

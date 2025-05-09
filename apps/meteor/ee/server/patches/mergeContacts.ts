import type { ILivechatContact, ILivechatContactChannel, ILivechatContactVisitorAssociation } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatRooms, Settings } from '@rocket.chat/models';
import type { ClientSession } from 'mongodb';

import { notifyOnSettingChanged } from '../../../app/lib/server/lib/notifyListener';
import { isSameChannel } from '../../../app/livechat/lib/isSameChannel';
import { ContactMerger } from '../../../app/livechat/server/lib/contacts/ContactMerger';
import { mergeContacts } from '../../../app/livechat/server/lib/contacts/mergeContacts';
import { contactLogger as logger } from '../../app/livechat-enterprise/server/lib/logger';

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

	const channel = originalContact.channels.find((channel: ILivechatContactChannel) => isSameChannel(channel.visitor, visitor));
	if (!channel) {
		throw new Error('error-invalid-channel');
	}

	logger.debug({ msg: 'Getting similar contacts', contactId });

	const similarContacts: ILivechatContact[] = await LivechatContacts.findSimilarVerifiedContacts(channel, contactId, { session });

	if (!similarContacts.length) {
		logger.debug({ msg: 'No similar contacts found', contactId });
		return originalContact;
	}

	logger.debug({ msg: `Found ${similarContacts.length} contacts to merge`, contactId });
	for await (const similarContact of similarContacts) {
		const fields = ContactMerger.getAllFieldsFromContact(similarContact);
		await ContactMerger.mergeFieldsIntoContact({ fields, contact: originalContact, session });
	}

	const similarContactIds = similarContacts.map((c) => c._id);
	const { deletedCount } = await LivechatContacts.deleteMany({ _id: { $in: similarContactIds } }, { session });

	const value = await Settings.incrementValueById('Merged_Contacts_Count', similarContacts.length, { returnDocument: 'after' });
	if (value) {
		void notifyOnSettingChanged(value);
	}
	logger.info({
		msg: 'contacts have been deleted and merged with a contact',
		similarContactIds,
		deletedCount,
		originalContactId: originalContact._id,
	});

	logger.debug({ msg: 'Updating rooms with new contact id', contactId });
	await LivechatRooms.updateMergedContactIds(similarContactIds, contactId, { session });

	return LivechatContacts.findOneById(contactId, { session });
};

mergeContacts.patch(runMergeContacts, () => License.hasModule('contact-id-verification'));

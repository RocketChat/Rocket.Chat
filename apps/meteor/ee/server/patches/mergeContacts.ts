import type { ILivechatContact, ILivechatContactChannel } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts } from '@rocket.chat/models';

import { ContactMerger } from '../../../app/livechat/server/lib/ContactMerger';
import { mergeContacts } from '../../../app/livechat/server/lib/Contacts';

await License.onLicense('contact-id-verification', () => {
	mergeContacts.patch(async (_next, contactId: string, channel: ILivechatContactChannel): Promise<ILivechatContact | null> => {
		const originalContact = (await LivechatContacts.findOneById(contactId)) as ILivechatContact;

		const similarContacts: ILivechatContact[] = await LivechatContacts.findSimilarVerifiedContacts(channel, contactId);

		if (!similarContacts.length) {
			return originalContact;
		}

		for await (const similarContact of similarContacts) {
			await ContactMerger.mergeContact(originalContact, similarContact);
		}

		await LivechatContacts.deleteMany({ _id: { $in: similarContacts.map((c) => c._id) } });
		return LivechatContacts.findOneById(contactId);
	});
});

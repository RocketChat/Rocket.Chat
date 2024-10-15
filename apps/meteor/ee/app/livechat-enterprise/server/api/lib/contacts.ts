import type { ILivechatContact } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts } from '@rocket.chat/models';

export async function changeContactBlockStatus({ contactId, block, visitorId }: { contactId: string; visitorId: string; block: boolean }) {
	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id' | 'channels'>>(contactId, {
		projection: { _id: 1, channels: 1 },
	});

	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	const channel = contact.channels?.find((channel) => channel.visitorId === visitorId);

	if (!channel) {
		throw new Error('error-channel-not-found');
	}

	channel.blocked = block;

	await LivechatContacts.updateOne({ _id: contactId }, { $set: { channels: contact.channels } });
}

export async function hasSingleContactLicense() {
	if (!License.hasModule('chat.rocket.contact-id-verification')) {
		throw new Meteor.Error('error-action-not-allowed', 'This is an enterprise feature');
	}
}

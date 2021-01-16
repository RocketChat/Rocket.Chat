import stripHtml from 'string-strip-html';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { EmailInbox } from '../../app/models/server/raw';
import { IMAPInterceptor } from '../email/IMAPInterceptor';
import { Livechat } from '../../app/livechat/server';
import LivechatVisitors from '../../app/models/server/models/LivechatVisitors';
import LivechatRooms from '../../app/models/server/models/LivechatRooms';

const IMAPInboxes = new Set<IMAPInterceptor>();

function getGuestByEmail(email: string, name: string): any {
	const guest = LivechatVisitors.findOneGuestByEmailAddress(email);

	if (guest) {
		// console.log('Guest found', guest);
		return guest;
	}

	const userId = Livechat.registerGuest({
		token: Random.id(),
		name: name || email,
		email,
		department: undefined,
		phone: undefined,
		username: undefined,
		connectionData: undefined,
	});

	const newGuest = LivechatVisitors.findOneById(userId, {});
	if (newGuest) {
		// console.log('Guest created', newGuest);
		return newGuest;
	}

	throw new Error('Error getting guest');
}

async function configureEmailInboxes(): Promise<void> {
	const emailInboxesCursor = EmailInbox.find({
		active: true,
	});

	for (const imap of IMAPInboxes) {
		imap.stop();
	}

	IMAPInboxes.clear();

	for await (const emailInboxRecord of emailInboxesCursor) {
		console.log('Setting up email interceptor for', emailInboxRecord.email);

		// TODO: Get attachments
		const imap = new IMAPInterceptor({
			password: emailInboxRecord.imap.password,
			user: emailInboxRecord.imap.username,
			host: emailInboxRecord.imap.server,
			port: parseInt(emailInboxRecord.imap.port),
			tls: emailInboxRecord.imap.sslTls,
			tlsOptions: {
				// TODO: Check why it's not working without this setting
				rejectUnauthorized: false,
			},
			// debug: (...args: any[]): void => console.log(...args),
		}, {
			deleteAfterRead: false,
			filter: [['UNSEEN'], ['SINCE', emailInboxRecord.ts]],
			rejectBeforeTS: emailInboxRecord.ts,
			markSeen: true,
		});

		IMAPInboxes.add(imap);

		imap.on('email', Meteor.bindEnvironment((email) => {
			// console.log('NEW EMAIL =>', email.text);
			console.log('NEW EMAIL =>', email);

			if (!email.from?.value?.[0]?.address) {
				return;
			}

			const thread = email.references?.[0] ?? email.messageId;

			const guest = getGuestByEmail(email.from.value[0].address, email.from.value[0].name);

			// TODO: Get the closed room and reopen rather than create a new one
			// const room = LivechatRooms.findOneByVisitorTokenAndEmailThread(guest.token, emailThread, {});
			const room = LivechatRooms.findOneOpenByVisitorTokenAndEmailThread(guest.token, thread, {});

			let msg = email.text;

			if (email.html) {
				// Try to remove the signature and history
				msg = stripHtml(email.html.replace(/<div name="messageSignatureSection.+/s, ''));
			}

			Livechat.sendMessage({
				guest,
				message: {
					_id: Random.id(),
					msg,
					rid: room?._id ?? Random.id(),
					email: {
						references: email.references,
					},
				},
				roomInfo: {
					email: {
						thread,
						subject: email.subject,
					},
				},
				agent: undefined,
			});
		}));

		imap.start();
	}
}

// TODO: Sync changes
configureEmailInboxes();

// TODO: Remove, used to update from client while the sync is not implemented
Meteor.methods({
	configureEmailInboxes() {
		configureEmailInboxes();
	},
});

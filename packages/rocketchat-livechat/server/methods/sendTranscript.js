/* globals emailSettings, DDPRateLimiter */
/* Send a transcript of the room converstation to the given email */
import moment from 'moment';

import LivechatVisitors from '../models/LivechatVisitors';

Meteor.methods({
	'livechat:sendTranscript'(token, rid, email) {
		check(rid, String);
		check(email, String);

		const room = RocketChat.models.Rooms.findOneById(rid);

		const visitor = LivechatVisitors.getVisitorByToken(token);
		const userLanguage = (visitor && visitor.language) || RocketChat.settings.get('language') || 'en';

		// allow to only user to send transcripts from their own chats
		if (!room || room.t !== 'l' || !room.v || room.v.token !== token) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		const messages = RocketChat.models.Messages.findVisibleByRoomId(rid, { sort: { 'ts' : 1 }});
		const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
		const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');

		let html = '<div> <hr>';
		messages.forEach(message => {
			if (message.t && ['command', 'livechat-close', 'livechat_video_call'].indexOf(message.t) !== -1) {
				return;
			}

			let author;
			if (message.u._id === visitor._id) {
				author = TAPi18n.__('You', { lng: userLanguage });
			} else {
				author = message.u.username;
			}

			const datetime = moment(message.ts).locale(userLanguage).format('LLL');
			const singleMessage = `
				<p><strong>${ author }</strong>  <em>${ datetime }</em></p>
				<p>${ message.msg }</p>
			`;
			html = html + singleMessage;
		});

		html = `${ html }</div>`;

		let fromEmail = RocketChat.settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

		if (fromEmail) {
			fromEmail = fromEmail[0];
		} else {
			fromEmail = RocketChat.settings.get('From_Email');
		}

		emailSettings = {
			to: email,
			from: fromEmail,
			replyTo: fromEmail,
			subject: TAPi18n.__('Transcript_of_your_livechat_conversation', { lng: userLanguage }),
			html: header + html + footer
		};

		Meteor.defer(() => {
			Email.send(emailSettings);
		});

		Meteor.defer(() => {
			RocketChat.callbacks.run('livechat.sendTranscript', messages, email);
		});

		return true;
	}
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'livechat:sendTranscript',
	connectionId() {
		return true;
	}
}, 1, 5000);

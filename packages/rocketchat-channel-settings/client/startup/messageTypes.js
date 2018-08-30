import s from 'underscore.string';

Meteor.startup(function() {
	RocketChat.MessageTypes.registerType({
		id: 'room_changed_privacy',
		system: true,
		message: 'room_changed_privacy',
		data(message) {
			return {
				user_by: message.u && message.u.username,
				room_type: t(message.msg),
			};
		},
	});

	RocketChat.MessageTypes.registerType({
		id: 'room_changed_topic',
		system: true,
		message: 'room_changed_topic',
		data(message) {
			return {
				user_by: message.u && message.u.username,
				room_topic: s.escapeHTML(message.msg || `(${ t('None').toLowerCase() })`),
			};
		},
	});

	RocketChat.MessageTypes.registerType({
		id: 'room_changed_announcement',
		system: true,
		message: 'room_changed_announcement',
		data(message) {
			return {
				user_by: message.u && message.u.username,
				room_announcement: s.escapeHTML(message.msg || `(${ t('None').toLowerCase() })`),
			};
		},
	});

	RocketChat.MessageTypes.registerType({
		id: 'room_changed_description',
		system: true,
		message: 'room_changed_description',
		data(message) {
			return {
				user_by: message.u && message.u.username,
				room_description: s.escapeHTML(message.msg || `(${ t('None').toLowerCase() })`),
			};
		},
	});

	RocketChat.MessageTypes.registerType({
		id: 'join-private-channel',
		system: true,
		message: 'Room_join_request',
		data(message) {
			return {
				user: `<a class="mention-link" data-username= "${ message.attachments[0].fields[0].requester }" >${ message.attachments[0].fields[0].requester } </a>`
			};
		}
	});

	RocketChat.MessageTypes.registerType({
		id: 'join-request-accepted',
		system: true,
		message: 'Room_join_request_accepted',
		data(message) {
			const room = message.room;
			Template.room.events({
				'click .mention-group'(event) {
					//Get the request path for router navigation
					FlowRouter.go('group', {name: $(event.currentTarget).data('group')});
				}
			});
			return {
				user: ` <a class="mention-link" data-username= "${ message.name }" >${ message.name } </a> `,
				roomName: ` <a class="mention-group" data-group="${ room.name }">${ room.fname || room.name } </a>`
			};
		}
	});
});

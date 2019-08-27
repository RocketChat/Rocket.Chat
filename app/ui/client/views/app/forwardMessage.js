import { Blaze } from 'meteor/blaze';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import { getUserAvatarURL } from '../../../../utils/client';
import { modal, call, MessageAction } from '../../../../ui-utils/client';

Template.forwardMessage.helpers({
	selected() {
		return Template.instance().forwardRoomsList.get();
	},
	forwardDisabled() {
		return Template.instance().forwardRoomsList.get().length === 0 ? 'disabled' : '';
	},

	autocompleteChannelSettings() {
		return {
			limit: 10,
			inputDelay: 300,
			rules: [
				{
					collection: 'CachedChannelList',
					subscription: 'channelAndPrivateAutocomplete',
					field: 'name',
					matchAll: true,
					filter: {
						exceptions: Template.instance().forwardRoomsList.get().map((u) => u.name),
					},
					template: Template.roomSearch,
					noMatchTemplate: Template.roomSearchEmpty,
					doNotChangeWidth: false,
					selector(match) {
						return { name: match };
					},
					sort: 'name',
				},
			],
		};
	},
});

Template.forwardMessage.onCreated(function() {
	const { message } = this.data;
	this.data.attachment = {
		text: message.msg,
		translations: message.translations,
		author_name: message.alias || message.u.username,
		author_icon: Meteor.absoluteUrl(getUserAvatarURL(message.u.username)),
		attachments: message.attachments || [],
		ts: message.ts.toISOString(),
	};
	this.forwardRoomsList = new ReactiveVar([]);
	this.userFilter = new ReactiveVar('');
});

Template.forwardMessage.onRendered(function() {
	this.firstNode.querySelector('[name="recipients"]').focus();
});

Template.forwardMessage.events({
	'keydown [name="recipients"]'(e, t) {
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const rooms = t.forwardRoomsList;
			const roomsArr = rooms.get();
			roomsArr.pop();
			return rooms.set(roomsArr);
		}
	},
	'click .rc-tags__tag'({ target }, t) {
		const { name } = Blaze.getData(target);
		t.forwardRoomsList.set(t.forwardRoomsList.get().filter((room) => room.name !== name));
	},
	'autocompleteselect input[name=recipients]'(event, template, item) {
		const rooms = template.forwardRoomsList;
		const roomsArr = rooms.get();
		roomsArr.push(item);
		rooms.set(roomsArr);
		event.currentTarget.value = '';
	},

	async 'submit .forward-message__content'(event, instance) {
		event.preventDefault();
		event.stopPropagation();
		const rooms = instance.forwardRoomsList.get();

		const permalink = await MessageAction.getPermaLink(instance.data.message._id);

		if (rooms.length > 0) {
			rooms.forEach(async (room) => {
				await call('sendMessage', {
					_id: Random.id(),
					rid: room._id,
					attachments: [{
						...instance.data.attachment,
						message_link: permalink,
					}],
				});
			});

			modal.close();

			toastr.success(TAPi18n.__('Message_Has_Been_Forwarded'));
		} else {
			toastr.error(TAPi18n.__('Forward_Has_Empty_Destination'));
		}
	},
});

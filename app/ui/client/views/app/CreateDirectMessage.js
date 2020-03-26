import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { roomTypes } from '../../../../utils/client';
import { call } from '../../../../ui-utils/client';
import './CreateDirectMessage.html';

Template.CreateDirectMessage.helpers({
	onSelectUser() {
		return Template.instance().onSelectUser;
	},
	createIsDisabled() {
		return Template.instance().selectedUsers.get().length === 0 ? 'disabled' : '';
	},
	parentChannel() {
		const instance = Template.instance();
		return instance.parentChannel.get();
	},
	selectedUsers() {
		const myUsername = Meteor.user().username;
		const { message } = this;
		const users = Template.instance().selectedUsers.get().map((e) => e);
		if (message) {
			users.unshift(message.u);
		}
		return users.filter(({ username }) => myUsername !== username);
	},

	onClickTagUser() {
		return Template.instance().onClickTagUser;
	},
	deleteLastItemUser() {
		return Template.instance().deleteLastItemUser;
	},
	onClickTagRoom() {
		return Template.instance().onClickTagRoom;
	},
	selectedRoom() {
		return Template.instance().selectedRoom.get();
	},
	userModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `@${ f.length === 0 ? text : text.replace(new RegExp(filter.get()), (part) => `<strong>${ part }</strong>`) }`;
		};
	},
	nameSuggestion() {
		return Template.instance().discussionName.get();
	},
});

const waitUntilRoomBeInserted = async (rid) => new Promise((resolve) => {
	Tracker.autorun((c) => {
		const room = roomTypes.findRoom('d', rid, Meteor.user());
		if (room) {
			c.stop();
			return resolve(room);
		}
	});
});

Template.CreateDirectMessage.events({
	async 'submit #create-dm, click .js-save-dm'(event, instance) {
		event.preventDefault();
		const users = instance.selectedUsers.get().map(({ username }) => username).filter((value, index, self) => self.indexOf(value) === index);

		const result = await call('createDirectMessage', ...users);

		if (instance.data.onCreate) {
			instance.data.onCreate(result);
		}

		await waitUntilRoomBeInserted(result.rid);

		const user = Meteor.user();
		roomTypes.openRouteLink(result.t, { ...result, name: result.usernames.filter((username) => username !== user.username).join(', ') });
	},
});

Template.CreateDirectMessage.onRendered(function() {
	this.find('#directMessageUsers').focus();
});

Template.CreateDirectMessage.onCreated(function() {
	this.selectedUsers = new ReactiveVar([]);

	this.onSelectUser = ({ item: user }) => {
		if (user.username === Meteor.user().username) {
			return;
		}
		const users = this.selectedUsers.get();
		if (!users.find((u) => user.username === u.username)) {
			this.selectedUsers.set([...users, user]);
		}
	};

	this.onClickTagUser = ({ username }) => {
		this.selectedUsers.set(this.selectedUsers.get().filter((user) => user.username !== username));
	};

	this.deleteLastItemUser = () => {
		const arr = this.selectedUsers.get();
		arr.pop();
		this.selectedUsers.set(arr);
	};
});

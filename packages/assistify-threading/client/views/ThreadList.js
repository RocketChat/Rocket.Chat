import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ChatSubscription } from 'meteor/rocketchat:models';

Template.ThreadList.onCreated(function() {
	this.threadSubscriptions = new ReactiveVar([]);
});

Template.ThreadList.helpers({
	rooms() {
		return Template.instance().threadSubscriptions.get();
	},
});

Template.ThreadList.onRendered(function() {
	Tracker.autorun(() => {
		const user = Meteor.userId();
		const sortBy = RocketChat.getUserPreference(user, 'sidebarSortby') || 'alphabetical';
		const query = {
			open: true,
		};

		const sort = {};

		if (sortBy === 'activity') {
			sort.lm = -1;
		} else { // alphabetical
			sort[this.identifier === 'd' && RocketChat.settings.get('UI_Use_Real_Name') ? 'lowerCaseFName' : 'lowerCaseName'] = /descending/.test(sortBy) ? -1 : 1;
		}

		query.parentRoomId = { $exists: true };
		this.threadSubscriptions.set(ChatSubscription.find(query, { sort }).fetch());
	});
});

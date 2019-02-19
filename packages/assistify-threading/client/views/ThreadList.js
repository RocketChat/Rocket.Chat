import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ChatSubscription } from 'meteor/rocketchat:models';

Template.ThreadList.helpers({
	rooms() {
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

		query.prid = { $exists: true };
		return ChatSubscription.find(query, { sort });
	},
});

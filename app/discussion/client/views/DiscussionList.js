import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ChatSubscription } from '../../../models';
import { getUserPreference } from '../../../utils';
import { settings } from '../../../settings';
Template.DiscussionList.helpers({
	rooms() {
		const user = Meteor.userId();
		const sortBy = getUserPreference(user, 'sidebarSortby') || 'alphabetical';
		const query = {
			open: true,
		};

		const sort = {};

		if (sortBy === 'activity') {
			sort.lm = -1;
		} else { // alphabetical
			sort[this.identifier === 'd' && settings.get('UI_Use_Real_Name') ? 'lowerCaseFName' : 'lowerCaseName'] = /descending/.test(sortBy) ? -1 : 1;
		}

		query.prid = { $exists: true };
		return ChatSubscription.find(query, { sort });
	},
});

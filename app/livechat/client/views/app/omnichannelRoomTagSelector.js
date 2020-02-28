import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './omnichannelRoomTagSelector.html';

Template.omnichannelRoomTagSelector.helpers({
	availableTags() {
		return Template.instance().availableTags.get();
	},

	hasAvailableTags() {
		const tags = Template.instance().availableTags.get();
		return tags && tags.length > 0;
	},
});

Template.omnichannelRoomTagSelector.onCreated(function() {
	this.availableTags = new ReactiveVar([]);

	Meteor.call('livechat:getTagsList', (err, tagsList) => {
		this.availableTags.set(tagsList);
	});
});

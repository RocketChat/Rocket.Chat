import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './livechatRoomTagSelector.html';

Template.livechatRoomTagSelector.helpers({
	availableTags() {
		return Template.instance().availableTags.get();
	},

	hasAvailableTags() {
		const tags = Template.instance().availableTags.get();
		return tags && tags.length > 0;
	},
});

Template.livechatRoomTagSelector.onCreated(function () {
	this.availableTags = new ReactiveVar([]);

	Meteor.call('livechat:getTagsList', (err, tagsList) => {
		this.availableTags.set(tagsList);
	});
});

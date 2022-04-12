import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';

import { Subscriptions } from '../../models';

Template.tokenChannelsList.helpers({
	rooms() {
		return Template.instance()
			.tokenpassRooms.get()
			.filter((room) => Subscriptions.find({ rid: room._id }).count() === 0);
	},
});

Template.tokenChannelsList.onRendered(function () {
	Tracker.autorun((c) => {
		const user = Meteor.user();
		if (user && user.services && user.services.tokenpass) {
			c.stop();

			Meteor.call('findTokenChannels', (error, result) => {
				if (!error) {
					this.tokenpassRooms.set(result);
				}
			});
		}
	});
});

Template.tokenChannelsList.onCreated(function () {
	this.tokenpassRooms = new ReactiveVar([]);
});

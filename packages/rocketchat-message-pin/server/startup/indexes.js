import { Meteor } from 'meteor/meteor';
import { Messages } from 'meteor/rocketchat:models';

Meteor.startup(function() {
	return Meteor.defer(function() {
		return Messages.tryEnsureIndex({
			'pinnedBy._id': 1,
		}, {
			sparse: 1,
		});
	});
});

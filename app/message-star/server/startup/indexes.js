import { Meteor } from 'meteor/meteor';
import { Messages } from '/app/models';

Meteor.startup(function() {
	return Meteor.defer(function() {
		return Messages.tryEnsureIndex({
			'starred._id': 1,
		}, {
			sparse: 1,
		});
	});
});

import { Meteor } from 'meteor/meteor';

import { Messages } from '../../app/models';


Meteor.methods({
	getLastMessage(rid) {
		return Messages.findOne({ rid, _hidden: { $ne: true } }, { sort: { ts: 1 } });
	},
});

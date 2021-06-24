import { Meteor } from 'meteor/meteor';

import { OEmbed } from '../../../models';

Meteor.methods({
	listOembed(query, options) {
		return OEmbed.find(query, options).fetch();
	},
});

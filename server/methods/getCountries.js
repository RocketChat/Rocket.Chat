// DEPRECATE
import { Meteor } from 'meteor/meteor';

import { Country } from '../../app/models';

Meteor.methods({
	getCountry() {
		return Country.findAllCountry();
	},
});

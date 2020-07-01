// DEPRECATE
import { Meteor } from 'meteor/meteor';

import { Country } from '../../app/models';

Meteor.methods({
	getCountry() {
		return new Promise((resolve, reject) => {
			reject(null);
			resolve(Country.findAllCouhntry());
		});
	},
});

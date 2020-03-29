import { Meteor } from 'meteor/meteor';

export function hasLicense(feature) {
	return new Promise((resolve, reject) => {
		Meteor.call('license:hasLicense', feature, (error, result) => {
			if (error) {
				return reject(error);
			}

			return resolve(result);
		});
	});
}

import { Meteor } from 'meteor/meteor';

let isEnterpriseServer = false;

export function isEnterprise(): boolean {
	return isEnterpriseServer;
}

export const refreshEnterpriseState = function() {
	Meteor.call('license:isEnterprise', (err, result) => {
		if (err) {
			throw err;
		}

		isEnterpriseServer = result;
	});
};

Meteor.startup(() => {
	refreshEnterpriseState();
});

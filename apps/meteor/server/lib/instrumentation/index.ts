import { Meteor } from 'meteor/meteor';

import { runOverwrittenPublish } from './registers';

const originalMeteorPublish = Meteor.publish;

Meteor.publish = function (name, func) {
	return originalMeteorPublish(name, function (...args: any) {
		return runOverwrittenPublish.call(this, { name, func, args });
	});
};

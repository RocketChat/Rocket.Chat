import { Meteor } from 'meteor/meteor';
import { CustomSounds } from '../../../models';
import s from 'underscore.string';

Meteor.publish('customSounds', function(filter, limit) {
	if (!this.userId) {
		return this.ready();
	}

	const fields = {
		name: 1,
		extension: 1,
	};

	filter = s.trim(filter);

	const options = {
		fields,
		limit,
		sort: { name: 1 },
	};

	if (filter) {
		const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
		return CustomSounds.findByName(filterReg, options);
	}

	return CustomSounds.find({}, options);
});

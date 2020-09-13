import { Meteor } from 'meteor/meteor';

import { Settings } from '../../models/server';
import { setValue } from './raw';

const updateValue = (id, fields) => {
	if (typeof fields.value === 'undefined') {
		return;
	}
	setValue(id, fields.value);
};

Meteor.startup(() => {
	Settings.find({}, { fields: { value: 1 } }).fetch().forEach((record) => updateValue(record._id, { value: record.value }));

	Settings.on('change', ({ clientAction, id, data, diff }) => {
		switch (clientAction) {
			case 'inserted':
			case 'updated':
				data = data ?? diff;
				if (data.value) {
					updateValue(id, { value: data.value });
				}
				break;
			case 'removed':
				setValue(id, undefined);
				break;
		}
	});
});

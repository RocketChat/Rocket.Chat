import { Meteor } from 'meteor/meteor';

import { Settings } from '../../models/server';
import { setValue } from './raw';

const updateValue = (id, fields) => {
	if (typeof fields.value === 'undefined') {
		return;
	}
	setValue(id, fields.value);
};

Meteor.startup(() => Settings.find({}, { fields: { value: 1 } }).observeChanges({
	added: updateValue,
	changed: updateValue,
	removed(id) {
		setValue(id, undefined);
	},
}));

import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 104,
	up() {
		if ((Settings.findOne({ _id: 'theme-color-rc-color-primary' }) || {}).value === '#04436A' &&
			(Settings.findOne({ _id: 'theme-color-rc-color-primary-darkest' }) || {}).value === '#335a' &&
			(Settings.findOne({ _id: 'theme-color-rc-color-primary-dark' }) || {}).value === '#16557c' &&
			(Settings.findOne({ _id: 'theme-color-rc-color-primary-light' }) || {}).value === '#72b1d8' &&
			(Settings.findOne({ _id: 'theme-color-rc-color-primary-light-medium' }) || {}).value === '#a0dfff' &&
			(Settings.findOne({ _id: 'theme-color-rc-color-primary-lightest' }) || {}).value === '#ccffff'
		) {
			Settings.update({ _id: 'theme-color-rc-color-primary' }, { $set: { editor: 'expression', value: 'color-dark' } });
			Settings.update({ _id: 'theme-color-rc-color-primary-darkest' }, { $set: { editor: 'expression', value: 'color-darkest' } });
			Settings.update({ _id: 'theme-color-rc-color-primary-dark' }, { $set: { editor: 'expression', value: 'color-dark-medium' } });
			Settings.update({ _id: 'theme-color-rc-color-primary-light' }, { $set: { editor: 'expression', value: 'color-gray' } });
			Settings.update({ _id: 'theme-color-rc-color-primary-light-medium' }, { $set: { editor: 'expression', value: 'color-gray-medium' } });
			Settings.update({ _id: 'theme-color-rc-color-primary-lightest' }, { $set: { editor: 'expression', value: 'color-gray-lightest' } });
		}
	},
});

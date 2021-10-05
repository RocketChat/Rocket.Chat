import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 207,
	up() {
		Settings.removeById('theme-color-tertiary-background-color');
	},
});

import { Migrations } from '../../../app/migrations/server';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 191,
	up() {
		Settings.remove({ _id: /theme-color-status/ }, { multi: true });
	},
});

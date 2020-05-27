import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 191,
	up() {
		Settings.remove({ _id: /theme-color-status/ }, { multi: true });
	},
});

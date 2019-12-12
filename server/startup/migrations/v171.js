import { Migrations } from '../../../app/migrations/server';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 171,
	up() {
		Settings.remove({ _id: 'AutoLinker_UrlsRegExp' });
	},
	down() {
		// Down migration does not apply in this case
	},
});

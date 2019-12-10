import { Migrations } from '../../../app/migrations/server';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 171,
	up() {
		const settings = [
			'AutoLinker_UrlsRegExp',
		];

		Settings.remove({ _id: { $in: settings } });
	},
	down() {
		// Down migration does not apply in this case
	},
});

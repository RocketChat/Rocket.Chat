import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 173,
	up() {
		Settings.remove({ _id: 'AutoLinker_UrlsRegExp' });
	},
});

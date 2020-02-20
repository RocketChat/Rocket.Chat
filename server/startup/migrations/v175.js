import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 175,
	up() {
		Settings.remove({ _id: 'AutoLinker_UrlsRegExp' });
	},
});

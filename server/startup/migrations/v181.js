import { Migrations } from '../../../app/migrations';
import { Analytics } from '../../../app/models/server';

Migrations.add({
	version: 181,
	up() {
		Analytics.remove({});
	},
});

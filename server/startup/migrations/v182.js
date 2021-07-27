import { Migrations } from '../../../app/migrations';
import { Analytics } from '../../../app/models/server';

Migrations.add({
	version: 182,
	up() {
		Analytics.remove({});
	},
});

import { Migrations } from '../../../app/migrations';
import { Analytics } from '../../../app/models/server';

Migrations.add({
	version: 180,
	up() {
		Analytics.remove({});
	},
});

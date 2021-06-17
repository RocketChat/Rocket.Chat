import { Migrations } from '../../../app/migrations';
import { Analytics } from '../../models';

Migrations.add({
	version: 182,
	up() {
		Analytics.remove({});
	},
});

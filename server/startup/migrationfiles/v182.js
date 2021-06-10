import { Migrations } from '../migrations';
import { Analytics } from '../../models';

Migrations.add({
	version: 182,
	up() {
		Analytics.remove({});
	},
});

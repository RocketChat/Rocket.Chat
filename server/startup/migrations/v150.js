import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 150,
	up() {
		const settings = [
			'Graphql_CORS',
			'Graphql_Enabled',
			'Graphql_Subscription_Port',
		];

		Settings.remove({ _id: { $in: settings } });
	},
	down() {
		// Down migration does not apply in this case
	},
});

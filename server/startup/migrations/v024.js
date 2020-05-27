import { Migrations } from '../../migrations';
import { Permissions } from '../../../app/models';

Migrations.add({
	version: 24,
	up() {
		return Permissions.remove({
			_id: 'access-rocket-permissions',
		});
	},
});

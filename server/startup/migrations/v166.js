import { Migrations } from '../../migrations';
import { WebdavAccounts } from '../../../app/models';

Migrations.add({
	version: 166,
	up() {
		WebdavAccounts.tryDropIndex({ user_id: 1, server_url: 1, username: 1, name: 1 });
		console.log('Fixing WebdavAccounts { user_id: 1, server_url: 1, username: 1, name: 1 }');
	},
});

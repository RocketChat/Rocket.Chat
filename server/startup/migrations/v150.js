import { Migrations } from '../../../app/migrations/server';
import { WebdavAccounts } from '../../../app/models';

Migrations.add({
	version: 150,
	up() {
		WebdavAccounts.tryDropIndex({ user_id: 1, server_url: 1, name: 1 });
		console.log('Fixing WebdavAccounts { user_id: 1, server_url: 1, name: 1 }');
	},
});

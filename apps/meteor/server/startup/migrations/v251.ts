import { addMigration } from '../../lib/migrations';
import { WebdavAccounts } from '../../../app/models/server/raw';

addMigration({
	version: 251,
	async up() {
		// eslint-disable-next-line quote-props
		// eslint-disable-next-line @typescript-eslint/camelcase
		await WebdavAccounts.updateMany({}, { $rename: { user_id: 'userId', server_url: 'serverURL' } });
	},
});

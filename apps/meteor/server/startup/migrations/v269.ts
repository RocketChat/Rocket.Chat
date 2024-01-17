import { Rooms } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 269,
	async up() {
		try {
			await Rooms.col.dropIndex('tokenpass.tokens.token_1');
			await Rooms.col.dropIndex('tokenpass_1');
		} catch (e) {
			console.log(e);
		}
	},
});

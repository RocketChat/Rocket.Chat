import { Messages } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 305,
	name: 'Drop index msg_text from collection Messages',
	async up() {
		if (await Messages.col.indexExists('msg_text')) await Messages.col.dropIndex('msg_text');
	},
});

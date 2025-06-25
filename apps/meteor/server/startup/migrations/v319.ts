import { LivechatRooms } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 319,
	name: 'Remove "pdfTranscriptRequested" index from LivechatRooms collection',
	async up() {
		await LivechatRooms.col.dropIndex('pdfTranscriptRequested_1');
	},
});

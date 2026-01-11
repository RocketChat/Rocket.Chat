import { LivechatRooms } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 319,
	name: 'Remove "pdfTranscriptRequested" index from LivechatRooms collection',
	async up() {
		try {
			await LivechatRooms.col.dropIndex('pdfTranscriptRequested_1');
		} catch {
			console.error('Error dropping index');
		}
	},
});

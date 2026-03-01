import { Logger } from '@rocket.chat/logger';
import { LivechatRooms } from '@rocket.chat/models';
import { addMigration } from '../../lib/migrations';

const logger = new Logger('Startup:V319');

addMigration({
	version: 319,
	name: 'Remove "pdfTranscriptRequested" index from LivechatRooms collection',
	async up() {
		try {
			await LivechatRooms.col.dropIndex('pdfTranscriptRequested_1');
		} catch {
			logger.error('Error dropping index');
		}
	},
});

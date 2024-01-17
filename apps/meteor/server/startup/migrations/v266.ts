import { addMigration } from '../../lib/migrations';

// this was the first migration added on version 5.0.0, so if this needs to run,
// it means the server was never updated to 5.x, which is not supported.
addMigration({
	version: 266,
	async up() {
		throw new Error(
			[
				'UPGRADE NOT SUPPORTED!',
				'',
				`It seems you're trying to upgrade from an unsupported version!`,
				'',
				'To be able to update to version 6.0.x you need to update to version 5.x first.',
			].join('\n'),
		);
	},
});

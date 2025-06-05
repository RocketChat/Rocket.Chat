import { addMigration } from '../../lib/migrations';

// this was the last migration added on version 7.0, so if this needs to run,
// it means the server was never updated to 8.x, which is not supported.
addMigration({
	version: 318,
	up() {
		throw new Error(
			[
				'UPGRADE NOT SUPPORTED!',
				'',
				`It seems you're trying to upgrade from an unsupported version!`,
				'',
				'To be able to update to version 8.x.y you need to update to version 7.x first.',
				'',
				'Read more: https://go.rocket.chat/i/how-to-upgrade',
			].join('\n'),
		);
	},
});

import { Migrations } from '../../../app/migrations';
import { Messages } from '../../../app/models';

Migrations.add({
	version: 22,
	up() {
		/*
		 * Update message edit field
		 */
		Messages.upgradeEtsToEditAt();

		return console.log('Updated old messages\' ets edited timestamp to new editedAt timestamp.');
	},
});

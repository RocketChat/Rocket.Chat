import { Settings, ReadReceipts } from '@rocket.chat/models';

import { addDataMigration } from '../../lib/dataMigrations';

addDataMigration({
	order: 1,
	id: 'disable-archive-for-large-read-receipts',
	description: 'Do not enable read receipts archive by default if there are more than 1 million records in the read receipts collection',
	strategy: 'once',
	direction: 'upgrade',
	requiresManualReversion: false,
	async run() {
		const count = await ReadReceipts.col.estimatedDocumentCount();

		if (count <= 1_000_000) {
			return;
		}

		await Settings.updateOne({ _id: 'Message_Read_Receipt_Archive_Enabled' }, { $set: { value: false } });
	},
});

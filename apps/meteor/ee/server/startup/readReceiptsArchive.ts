import { settings } from '../../../app/settings/server';
import { readReceiptsArchiveCron } from '../cron/readReceiptsArchive';

// Initialize the cron job
void readReceiptsArchiveCron();

// Watch for settings changes and update the cron schedule
settings.watch<string>('Message_Read_Receipt_Archive_Cron', async (value) => {
	if (value) {
		await readReceiptsArchiveCron();
	}
});

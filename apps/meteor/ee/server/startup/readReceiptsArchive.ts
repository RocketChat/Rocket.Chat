import { settings } from '../../../app/settings/server';
import { readReceiptsArchiveCron } from '../cron/readReceiptsArchive';

// Watch for settings changes and update the cron schedule
settings.watchMultiple(['Message_Read_Receipt_Archive_Cron', 'Message_Read_Receipt_Archive_Enabled'], async () => {
	await readReceiptsArchiveCron();
});

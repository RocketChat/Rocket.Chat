import { settings } from '../../../app/settings/server';


export function federationCron(SyncedCron: any): void {
	settings.get('FEDERATION_Enabled', async (_, value) => {
		if (!value) {
			return SyncedCron.remove('Federation');
		}
		const { runFederation } = await import('./federation.cron');
		SyncedCron.add({
			name: 'Federation',
			schedule(parser: any) {
				return parser.cron('* * * * *');
			},
			job: runFederation,
		});
	});
}

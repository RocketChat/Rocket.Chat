import { setCachingVersion, setInlineScriptsAllowed } from '../../app/cors/server/cors';
import type { ICachedSettings } from '../../app/settings/server/CachedSettings';

export async function configureCORS(settings: ICachedSettings): Promise<void> {
	settings.watch<boolean>('Enable_CSP', async (enabled) => {
		await setInlineScriptsAllowed(!enabled);
	});
	settings.watch<string>('Troubleshoot_Force_Caching_Version', (value) => {
		setCachingVersion(value);
	});
}

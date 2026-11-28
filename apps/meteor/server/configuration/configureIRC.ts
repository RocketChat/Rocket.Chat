import { startIrcBridge } from '../bridges/irc/startIrcBridge';
import type { ICachedSettings } from '../settings/CachedSettings';

export async function configureIRC(settings: ICachedSettings): Promise<void> {
	if (!settings.get('IRC_Enabled')) {
		return;
	}

	await startIrcBridge();
}

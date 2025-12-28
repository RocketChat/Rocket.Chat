import { RocketChatAssets } from '../../app/assets/server';
import type { ICachedSettings } from '../../app/settings/server/CachedSettings';

export async function configureAssets(settings: ICachedSettings): Promise<void> {
	settings.watchByRegex(/^Assets_/, (key, value) => RocketChatAssets.processAsset(key, value));
}

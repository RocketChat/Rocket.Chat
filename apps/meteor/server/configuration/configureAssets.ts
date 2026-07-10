import type { ICachedSettings } from '../../app/settings/server/CachedSettings';
import { RocketChatAssets } from '../lib/media/assets';

export async function configureAssets(settings: ICachedSettings): Promise<void> {
	settings.watchByRegex(/^Assets_/, (key, value) => RocketChatAssets.processAsset(key, value));
}

import type { IRocketChatAsset } from '@rocket.chat/core-typings';

import { RocketChatAssets } from '../lib/media/assets';
import type { ICachedSettings } from '../settings/CachedSettings';

export async function configureAssets(settings: ICachedSettings): Promise<void> {
	settings.watchByRegex(/^Assets_/, (key, value) =>
		RocketChatAssets.processAsset(key, value as Pick<IRocketChatAsset, 'url' | 'defaultUrl'> | undefined),
	);
}

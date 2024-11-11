import { sdk } from '../../app/utils/client/lib/SDKClient';
import { CachedCollectionManager } from './cachedCollections';

export const fetchFeatures = (): Promise<string[]> =>
	new Promise((resolve, reject) => {
		CachedCollectionManager.onLogin(() => {
			sdk.call('license:getModules').then(resolve, reject);
		});
	});

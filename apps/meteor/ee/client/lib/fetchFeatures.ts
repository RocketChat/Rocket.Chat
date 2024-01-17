import { CachedCollectionManager } from '../../../app/ui-cached-collection/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';

export const fetchFeatures = (): Promise<string[]> =>
	new Promise((resolve, reject) => {
		CachedCollectionManager.onLogin(() => {
			sdk.call('license:getModules').then(resolve, reject);
		});
	});

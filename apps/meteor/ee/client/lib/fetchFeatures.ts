import { CachedCollectionManager } from '../../../app/ui-cached-collection/client';
import { call } from '../../../client/lib/utils/call';

export const fetchFeatures = (): Promise<string[]> =>
	new Promise((resolve, reject) => {
		CachedCollectionManager.onLogin(() => {
			call('license:getModules').then(resolve, reject);
		});
	});

import { sdk } from './SDKClient';
import { whenLoggedIn } from './loggedIn';

export const fetchFeatures = (): Promise<string[]> =>
	whenLoggedIn()
		.then(() => sdk.rest.get('/v1/licenses.info', {}))
		.then(({ license }) => license.activeModules);

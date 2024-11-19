import { whenLoggedIn } from './loggedIn';
import { sdk } from '../../app/utils/client/lib/SDKClient';

export const fetchFeatures = (): Promise<string[]> => whenLoggedIn().then(() => sdk.call('license:getModules'));

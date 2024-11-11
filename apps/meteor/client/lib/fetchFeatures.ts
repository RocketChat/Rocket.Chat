import { sdk } from '../../app/utils/client/lib/SDKClient';
import { whenLoggedIn } from './loggedIn';

export const fetchFeatures = (): Promise<string[]> => whenLoggedIn().then(() => sdk.call('license:getModules'));

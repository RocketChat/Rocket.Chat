import { customOAuthServicesInit } from './oAuthServicesUpdate';
import './rateLimiter';
import './robots';
import './settingsOnLoadCdnPrefix';
import './settingsOnLoadDirectReply';
import './settingsOnLoadSMTP';

export const libStartup = async () => {
	await customOAuthServicesInit();
};

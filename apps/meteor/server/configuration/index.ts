import { configureAccounts } from './accounts_meld';
import { configureCAS } from './cas';
import { configureAssets } from './configureAssets';
import { configureBoilerplate } from './configureBoilerplate';
import { configureCDN } from './configureCDN';
import { configureCORS } from './configureCORS';
import { configureDirectReply } from './configureDirectReply';
import { configureIRC } from './configureIRC';
import { configureLogLevel } from './configureLogLevel';
import { configureSMTP } from './configureSMTP';
import { configureFederation } from './federation';
import { configureLDAP } from './ldap';
import { configureOAuth } from './oauth';
import { configurePushNotifications } from './pushNotification';
import type { ICachedSettings } from '../../app/settings/server/CachedSettings';

export async function configureServer(settings: ICachedSettings) {
	await Promise.all([
		configureLogLevel(settings),
		configureAccounts(),
		configureCAS(settings),
		configureLDAP(settings),
		configureOAuth(settings),
		configureAssets(settings),
		configureCORS(settings),
		configureCDN(settings),
		configurePushNotifications(settings),
		configureBoilerplate(settings),
		configureDirectReply(settings),
		configureSMTP(settings),
		configureFederation(settings),
		configureIRC(settings),
	]);
}

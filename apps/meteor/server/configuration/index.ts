import { configureAccounts } from './accounts_meld';
import { configureCAS } from './cas';
import { configureAssets } from './configureAssets';
import { configureBoilerplate } from './configureBoilerplate';
import { configureCDN } from './configureCDN';
import { configureCORS } from './configureCORS';
import { configureDirectReply } from './configureDirectReply';
import { configureIRC } from './configureIRC';
import { configureSMTP } from './configureSMTP';
import { configureFederation } from './federation';
import { configureLDAP } from './ldap';
import { configureOAuth } from './oauth';
import { configurePushNotifications } from './pushNotification';
import { settings } from '../../app/settings/server';

export async function configureLoginServices() {
	await configureAccounts();
	await configureCAS();
	await configureLDAP();
	await configureOAuth();

	await Promise.all([
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

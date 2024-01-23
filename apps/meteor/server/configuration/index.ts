import { configureAccounts } from './accounts_meld';
import { configureCAS } from './cas';
import { configureLDAP } from './ldap';
import { configureOAuth } from './oauth';

export async function configureLoginServices() {
	await configureAccounts();
	await configureCAS();
	await configureLDAP();
	await configureOAuth();
}

import { Logger } from '@rocket.chat/logger';

import { SAMLUtils } from './lib/Utils';
import { addSettings } from './lib/settings';
import { watchSamlServiceProviders } from './serviceProviders';

const logger = new Logger('steffo:meteor-accounts-saml');
SAMLUtils.setLoggerInstance(logger);

await addSettings('Default');

watchSamlServiceProviders();

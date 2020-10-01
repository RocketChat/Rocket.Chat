import { ServiceConfiguration } from 'meteor/service-configuration';

import { Base } from './_Base';

export class LoginServiceConfiguration extends Base {}

export default new LoginServiceConfiguration(ServiceConfiguration.configurations, { preventSetUpdatedAt: true });

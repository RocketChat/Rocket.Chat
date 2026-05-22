import type { ServerMethods } from '@rocket.chat/ddp-client';
import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'license:getModules'(): string[];
		'license:isEnterprise'(): boolean;
	}
}

Meteor.methods<ServerMethods>({
	'license:getModules'() {
		methodDeprecationLogger.method('license:getModules', '9.0.0', '/v1/licenses.info');
		return License.getModules();
	},
	'license:isEnterprise'() {
		methodDeprecationLogger.method('license:isEnterprise', '9.0.0', '/v1/licenses.info');
		return License.hasValidLicense();
	},
});

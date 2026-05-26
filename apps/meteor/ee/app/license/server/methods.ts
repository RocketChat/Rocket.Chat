import type { ILicenseTag, LicenseModule } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { License } from '@rocket.chat/license';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../../app/lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'license:hasLicense'(feature: string): boolean;
		'license:getModules'(): string[];
		'license:getTags'(): ILicenseTag[];
		'license:isEnterprise'(): boolean;
	}
}

Meteor.methods<ServerMethods>({
	'license:hasLicense'(feature: string) {
		methodDeprecationLogger.method('license:hasLicense', '9.0.0', '/v1/licenses.info');
		check(feature, String);

		return License.hasModule(feature as LicenseModule);
	},
	'license:getModules'() {
		return License.getModules();
	},
	'license:getTags'() {
		methodDeprecationLogger.method('license:getTags', '9.0.0', '/v1/licenses.info');
		return License.getTags();
	},
	'license:isEnterprise'() {
		return License.hasValidLicense();
	},
});

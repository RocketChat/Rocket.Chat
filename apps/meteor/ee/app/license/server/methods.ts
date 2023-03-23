import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import type { ILicenseTag } from '../definition/ILicenseTag';
import { getModules, getTags, hasLicense, isEnterprise } from './license';

declare module '@rocket.chat/ui-contexts' {
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
		check(feature, String);

		return hasLicense(feature);
	},
	'license:getModules'() {
		return getModules();
	},
	'license:getTags'() {
		return getTags();
	},
	'license:isEnterprise'() {
		return isEnterprise();
	},
});

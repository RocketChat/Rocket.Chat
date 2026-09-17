import type { ISetting } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../lib/deprecationWarningLogger';
import { getSetupWizardParameters } from '../../lib/getSetupWizardParameters';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getSetupWizardParameters(): Promise<{
			settings: ISetting[];
			serverAlreadyRegistered: boolean;
		}>;
	}
}

Meteor.methods<ServerMethods>({
	/**
	 * @deprecated this method is deprecated and will be removed soon.
	 * Prefer using the setupWizard.parameters rest api.
	 */
	async getSetupWizardParameters() {
		methodDeprecationLogger.method('getSetupWizardParameters', '9.0.0', '/v1/setupWizard.parameters');

		return getSetupWizardParameters();
	},
});

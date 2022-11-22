import { Meteor } from 'meteor/meteor';
import { Settings } from '@rocket.chat/models';

import { onValidateLicenses, getLicenses } from '../../app/license/server/license';

const handleHadTrial = (): void => {
	getLicenses().forEach(({ valid, license }): void => {
		if (!valid) {
			return;
		}

		if (license.meta?.trial) {
			Settings.updateValueById('Cloud_Workspace_Had_Trial', true);
		}
	});
};

Meteor.startup(() => {
	onValidateLicenses(handleHadTrial);
});

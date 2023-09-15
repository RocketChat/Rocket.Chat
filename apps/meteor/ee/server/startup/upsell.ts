import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { onValidateLicenses, getLicense } from '../../app/license/server/license';

const handleHadTrial = (): void => {
	if (getLicense()?.information.trial) {
		void Settings.updateValueById('Cloud_Workspace_Had_Trial', true);
	}
};

Meteor.startup(() => {
	onValidateLicenses(handleHadTrial);
});

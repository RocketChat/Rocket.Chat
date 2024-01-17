import { License } from '@rocket.chat/license';
import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

const handleHadTrial = (): void => {
	if (License.getLicense()?.information.trial) {
		void Settings.updateValueById('Cloud_Workspace_Had_Trial', true);
	}
};

Meteor.startup(() => {
	License.onValidateLicense(handleHadTrial);
});

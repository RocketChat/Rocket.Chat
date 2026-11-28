import { License } from '@rocket.chat/license';
import { Settings } from '@rocket.chat/models';

import { notifyOnSettingChangedById } from '../../../server/lib/notifyListener';
import { updateAuditedBySystem } from '../../../server/settings/lib/auditedSettingUpdates';

const handleHadTrial = (): void => {
	if (License.getLicense()?.information.trial) {
		void (async () => {
			(
				await updateAuditedBySystem({
					reason: 'handleHadTrial',
				})(Settings.updateValueById, 'Cloud_Workspace_Had_Trial', true)
			).modifiedCount && void notifyOnSettingChangedById('Cloud_Workspace_Had_Trial');
		})();
	}
};

export const registerHadTrialHandler = (): void => {
	License.onValidateLicense(handleHadTrial);
};

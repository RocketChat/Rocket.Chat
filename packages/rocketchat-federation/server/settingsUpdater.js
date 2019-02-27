import { Settings } from 'meteor/rocketchat:models';

class SettingsUpdater {
}

SettingsUpdater.updateStatus = function updateStatus(status) {
	Settings.updateValueById('FEDERATION_Status', Settings.updateNextStatusTo || status);

	Settings.updateNextStatusTo = null;
};

SettingsUpdater.updateNextStatusTo = function updateNextStatusTo(status) {
	Settings.updateNextStatusTo = status;
};

SettingsUpdater.updateEnabled = function updateEnabled(enabled) {
	Settings.updateValueById('FEDERATION_Enabled', enabled);
};

export default SettingsUpdater;

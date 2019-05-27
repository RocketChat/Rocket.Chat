import { Settings } from '../../../models/server/models/Settings';

Object.assign(Settings, {
	renameSetting(oldId, newId) {
		const oldSetting = Settings.findById(oldId).fetch()[0];
		if (oldSetting) {
			Settings.removeById(oldSetting._id);

			// there has been some problem with upsert() when changing the complete doc, so decide explicitly for insert or update
			let newSetting = Settings.findById(newId).fetch()[0];
			if (newSetting) {
				Settings.updateValueById(newId, oldSetting.value);
			} else {
				newSetting = oldSetting;
				newSetting._id = newId;
				delete newSetting.$loki;
				Settings.insert(newSetting);
			}
		}
	},
});

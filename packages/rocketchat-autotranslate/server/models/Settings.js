/* globals RocketChat */

Object.assign(RocketChat.models.Settings, {
	renameSetting(oldId, newId) {
		const oldSetting = RocketChat.models.Settings.findById(oldId).fetch()[0];
		if (oldSetting) {
			RocketChat.models.Settings.removeById(oldSetting._id);

			// there has been some problem with upsert() when changing the complete doc, so decide explicitly for insert or update
			let newSetting = RocketChat.models.Settings.findById(newId).fetch()[0];
			if (newSetting) {
				RocketChat.models.Settings.updateValueById(newId, oldSetting.value);
			} else {
				newSetting = oldSetting;
				newSetting._id = newId;
				delete newSetting.$loki;
				RocketChat.models.Settings.insert(newSetting);
			}
		}
	}
});

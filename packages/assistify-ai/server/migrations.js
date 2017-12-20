/*
Up to now, there's no "DB version" stored for assistify.
Until we've got expensive of contradicting migrations, we'll just use this file to write functions running
on startup which migrate data - ignoring the actual version
 */

const settingsDbsToAssistify = function() {

	const renameSetting = function(oldId, newId) {
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
	};

	renameSetting('DBS_AI_Enabled', 'Assistify_AI_Enabled');
	renameSetting('DBS_AI_Redlink_URL', 'Assistify_AI_Smarti_Base_URL');
	renameSetting('DBS_AI_Redlink_Auth_Token', 'Assistify_AI_Smarti_Auth_Token');
	renameSetting('DBS_AI_Redlink_Hook_Token', 'Assistify_AI_RocketChat_Webhook_Token');
	renameSetting('DBS_AI_Redlink_Domain', 'Assistify_AI_Smarti_Domain');

	// the next ones got new defaults, so just remove the old one
	RocketChat.models.Settings.removeById('DBS_AI_Source');
	RocketChat.models.Settings.removeById('reload_Assistify');

	// remove obsolete settings
	RocketChat.models.Settings.removeById('Assistify_AI_DBSearch_Suffix');
};

Meteor.startup(() => {

	settingsDbsToAssistify();

});

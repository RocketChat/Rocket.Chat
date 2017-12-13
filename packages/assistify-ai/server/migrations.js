/*
Up to now, there's no "DB version" stored for assistify.
Until we've got expensive of contradicting migrations, we'll just use this file to write functions running
on startup which migrate data - ignoring the actual version
 */

const settingsDbsToAssistify = function() {

	const renameSetting = function(oldId, newId) {
		const setting = RocketChat.models.Settings.findById(oldId).fetch()[0];
		if (setting) {
			RocketChat.models.Settings.removeById(setting._id);
			setting._id = newId;
			RocketChat.models.Settings.upsert({_id: setting._id}, setting);
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
};

Meteor.startup(() => {

	settingsDbsToAssistify();

});

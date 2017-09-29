Meteor.methods({
	'livechat:getTextsTranslation'(lang) {
		lang = lang.split('-')[0].toLowerCase();

		const settings = RocketChat.Livechat.getTextsTranslation(lang);

		const info = { language: lang };
		if (settings.Livechat_title) { info['title'] = settings.Livechat_title; }
		if (settings.Livechat_offline_title) { info['offlineTitle'] = settings.Livechat_offline_title; }
		if (settings.Livechat_offline_message) { info['offlineMessage'] = settings.Livechat_offline_message; }
		if (settings.Livechat_offline_success_message) { info['offlineSuccessMessage'] = settings.Livechat_offline_success_message; }
		if (settings.Livechat_offline_form_unavailable) { info['offlineUnavailableMessage'] = settings.Livechat_offline_form_unavailable; }

		return info;
	}
});

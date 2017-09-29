/*
* Update a setting by id
* @param {String} _id
*/
RocketChat.LivechatTexts = {};

RocketChat.LivechatTexts.updateByNameAndLang = function(identifier, lang, value) {
	if (identifier == null || value == null) {
		return false;
	}
	lang = lang || 'en';

	return RocketChat.models.LivechatTexts.upsertByNameAndLang(identifier, lang, value);
};


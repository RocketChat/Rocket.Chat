import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(() => {
	const languageSetting = RocketChat.models.Settings.db.findOneById('Language');
	if (!languageSetting.value && languageSetting.value === languageSetting.packageValue) {
		RocketChat.models.Settings.db.updateValueById(languageSetting._id, 'en');
	}

	/* Remove this three lines after they have been executed once on the target environment */
	RocketChat.models.Settings.db.removeById('Assistify_Show_Standard_Features');
	RocketChat.models.Settings.db.removeById('Assistify_Bot_Username');
	RocketChat.models.Settings.db.removeById('Assistify_Bot_Automated_Response_Threshold');
	RocketChat.models.Settings.db.removeById('Assistify_room_count');
	RocketChat.models.Settings.db.removeById('Experts_channel');
	RocketChat.models.Settings.db.removeById('Deactivate_close_comment');
});

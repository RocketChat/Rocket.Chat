import {automaticChannelsHandler} from 'meteor/rocketchat:automatic-channels-handler';
import {getLanguage} from './server';

automaticChannelsHandler.addCategory({
	categoryName: 'language',
	getChannelName: getLanguage,
	enable: 'Enable_Language',
	blacklist: 'Blacklist_Language'
});



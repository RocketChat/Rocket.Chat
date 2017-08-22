import {automaticChannelsHandler} from 'meteor/rocketchat:automatic-channels-handler';
import {getCountry} from './server';

automaticChannelsHandler.addCategory({
	categoryName: 'country',
	getChannelName: getCountry,
	enable: 'Enable_GeoIp',
	blacklist: 'Blacklist_GeoIp'
});


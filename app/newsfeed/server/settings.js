import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

import {initializeNewsfeed} from "./initialize";
import {deinitializeNewsfeed} from "./deinitialize";

const defaults = {
	enable: true,
};

Meteor.startup(() => {
	settings.addGroup('Newsfeed', function() {
		this.add('Newsfeed_enable', defaults.enable, {
			type: 'boolean',
			i18nLabel: 'Enable',
		});
	});
});

settings.get('Newsfeed_enable', (key, value) => {
	if(value === true){
		initializeNewsfeed();
	}
	else {
		deinitializeNewsfeed();
	}
});

import { Meteor } from 'meteor/meteor';

import { settings as clientSettings } from './client/index';
import { settings as serverSettings } from './server/index';
import { ICachedSettings } from './server/CachedSettings';

export let settings: ICachedSettings;

if (Meteor.isClient) {
	settings = clientSettings;
}
if (Meteor.isServer) {
	settings = serverSettings;
}

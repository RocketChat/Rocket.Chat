// import config from './moleculer.config';
import Notifications from './services/Notifications';
import Authorization from './services/authorization';
import User from './services/user';
import Settings from './services/settings';
import Core from '../rocketchat-lib/server/service';
import Streamer from '../rocketchat-streamer/index';
import PersonalAccessTokens from '../personal-access-tokens/server/service';
import GetReadReceipts from '../message-read-receipt/server/service';
import { ServiceBroker } from 'moleculer';
import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import config from './moleculer.config';
const broker = new ServiceBroker(config);

import Presence from '../presence';

broker.createService(Notifications);
broker.createService(Authorization);
broker.createService(User);
broker.createService(Settings);
broker.createService(Core);
broker.createService(PersonalAccessTokens);
broker.createService(GetReadReceipts);

broker.createService(Streamer);
broker.createService(Presence);

RocketChat.Services = broker;

Meteor.startup(() => {
	const { EXPERIMENTAL_IS_HUB } = process.env;
	if (EXPERIMENTAL_IS_HUB) {
		broker.createService(require('../rocketchat-hub/').default);
	}
	broker.start();
});



export default broker;

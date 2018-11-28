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

broker.createService(Notifications);
broker.createService(Authorization);
broker.createService(User);
broker.createService(Settings);
broker.createService(Core);
broker.createService(PersonalAccessTokens);
broker.createService(GetReadReceipts);

broker.createService(Streamer);

RocketChat.Services = broker;

Meteor.startup(() => {
	const { EXPERIMENTAL_IS_HUB, EXPERIMENTAL_PRESENCE_SERVICE } = process.env;
	if (EXPERIMENTAL_IS_HUB) {
		broker.createService(require('../rocketchat-hub/').default);
	}
	if (EXPERIMENTAL_PRESENCE_SERVICE) {
		broker.createService(require('../presence/server').default);
	}
	broker.start();
});



export default broker;

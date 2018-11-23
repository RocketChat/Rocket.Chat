// import config from './moleculer.config';
import Notifications from './services/Notifications';
import Authorization from './services/authorization';
import User from './services/user';
import Settings from './services/settings';
import Core from '../rocketchat-lib/server/service';
import PersonalAccessTokens from '../personal-access-tokens/server/service';
import GetReadReceipts from '../message-read-receipt/server/service';
import { ServiceBroker } from 'moleculer';
import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

const broker = new ServiceBroker({
	logLevel: 'info',
	sampleCount: 1,
	metrics: true,
	cacher: 'Memory',
});

broker.createService(Notifications);
broker.createService(Authorization);
broker.createService(User);
broker.createService(Settings);
broker.createService(Core);
broker.createService(PersonalAccessTokens);
broker.createService(GetReadReceipts);

RocketChat.Services = broker;

Meteor.startup(() => broker.start());

export default broker;

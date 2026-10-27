import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';

import { publishMeteorCollection } from './meteorCollection';
import type { Server } from '../ddp/Server';
import { MeteorCollection } from '../lib/MeteorCollection';

export function registerLoginServiceConfigurationPublication(server: Server): MeteorCollection<Partial<LoginServiceConfiguration>> {
	const collection = new MeteorCollection<Partial<LoginServiceConfiguration>>();
	publishMeteorCollection(server, 'meteor.loginServiceConfiguration', 'meteor_accounts_loginServiceConfiguration', collection);
	return collection;
}

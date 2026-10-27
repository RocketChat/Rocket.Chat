import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import type { Server } from '@rocket.chat/ddp-server';
import { MeteorCollection, publishMeteorCollection } from '@rocket.chat/ddp-server';

export function registerLoginServiceConfigurationPublication(server: Server): MeteorCollection<Partial<LoginServiceConfiguration>> {
	const collection = new MeteorCollection<Partial<LoginServiceConfiguration>>();
	publishMeteorCollection(server, 'meteor.loginServiceConfiguration', 'meteor_accounts_loginServiceConfiguration', collection);
	return collection;
}

import type { EventSignatures } from '@rocket.chat/core-services';
import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';

import { publishMeteorCollection } from './meteorCollection';
import type { Server } from '../Server';
import { MeteorCollection } from '../lib/MeteorCollection';

type LoginServiceConfigurationChange = Parameters<EventSignatures['watch.loginServiceConfiguration']>[0];

/** Applies a change to a login service's configuration, as the `watch.loginServiceConfiguration` event reports it. */
export function applyLoginServiceConfigurationChange(
	collection: MeteorCollection<Partial<LoginServiceConfiguration>>,
	{ clientAction, id, data }: LoginServiceConfigurationChange,
): void {
	if (clientAction === 'removed') {
		collection.remove(id);
		return;
	}
	if (data) {
		collection.set(id, data);
	}
}

export function registerLoginServiceConfigurationPublication(server: Server): MeteorCollection<Partial<LoginServiceConfiguration>> {
	const collection = new MeteorCollection<Partial<LoginServiceConfiguration>>();
	publishMeteorCollection(server, 'meteor.loginServiceConfiguration', 'meteor_accounts_loginServiceConfiguration', collection);
	return collection;
}

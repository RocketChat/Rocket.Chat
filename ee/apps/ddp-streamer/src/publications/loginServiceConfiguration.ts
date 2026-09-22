import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';

import type { Server } from '../Server';
import { publishMirroredCollection } from './mirroredCollection';
import { MirroredCollection } from '../lib/MirroredCollection';

export function registerLoginServiceConfigurationPublication(server: Server): MirroredCollection<Partial<LoginServiceConfiguration>> {
	const mirror = new MirroredCollection<Partial<LoginServiceConfiguration>>();
	publishMirroredCollection(server, 'meteor.loginServiceConfiguration', 'meteor_accounts_loginServiceConfiguration', mirror);
	return mirror;
}

import type { Emitter } from '@rocket.chat/emitter';
import { getAllServices, type HomeserverEventSignatures, type HomeserverServices } from '@rocket.chat/federation-sdk';

import { edus } from './edu';
import { member } from './member';
import { message } from './message';
import { ping } from './ping';
import { reaction } from './reaction';
import { room } from './room';

export function registerEvents(
	emitter: Emitter<HomeserverEventSignatures>,
	serverName: string,
	eduProcessTypes: { typing: boolean; presence: boolean },
	services: HomeserverServices = getAllServices(),
) {
	ping(emitter);
	message(emitter, serverName);
	reaction(emitter);
	member(emitter, services);
	edus(emitter, eduProcessTypes);
	room(emitter, services);
}

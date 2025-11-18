import type { Emitter } from '@rocket.chat/emitter';
import { type HomeserverEventSignatures } from '@rocket.chat/federation-sdk';

import { edus } from './edu';
import { member } from './member';
import { message } from './message';
import { ping } from './ping';
import { reaction } from './reaction';
import { room } from './room';

export function registerEvents(emitter: Emitter<HomeserverEventSignatures>) {
	ping(emitter);
	message(emitter);
	reaction(emitter);
	member(emitter);
	edus(emitter);
	room(emitter);
}

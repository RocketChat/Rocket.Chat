import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import type { Emitter } from '@rocket.chat/emitter';

import { edus } from './edu';
import { invite } from './invite';
import { member } from './member';
import { message } from './message';
import { ping } from './ping';
import { reaction } from './reaction';
import { room } from './room';

export function registerEvents(emitter: Emitter<HomeserverEventSignatures>) {
	ping(emitter);
	message(emitter);
	invite(emitter);
	reaction(emitter);
	member(emitter);
	edus(emitter);
	room(emitter);
}

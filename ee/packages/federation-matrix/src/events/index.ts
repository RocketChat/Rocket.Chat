import type { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures } from '@rocket.chat/homeserver';

import { invite } from './invite';
import { message } from './message';
import { ping } from './ping';

export function registerEvents(emitter: Emitter<HomeserverEventSignatures>) {
	ping(emitter);
	message(emitter);
	invite(emitter);
}

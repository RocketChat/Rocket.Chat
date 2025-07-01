import type { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures } from '@rocket.chat/homeserver';

import { message } from './message';
import { ping } from './ping';

export function registerEvents(emitter: Emitter<HomeserverEventSignatures>) {
	ping(emitter);
	message(emitter);
}

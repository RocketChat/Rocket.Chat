import type { HomeserverEventSignatures } from '@hs/federation-sdk';
import type { Emitter } from '@rocket.chat/emitter';

import { invite } from './invite';
import { membership } from './membership';
import { message } from './message';
import { ping } from './ping';
import { powerLevels } from './powerLevels';
import { reaction } from './reaction';
import { typing } from './typing';

export function registerEvents(emitter: Emitter<HomeserverEventSignatures>) {
	ping(emitter);
	message(emitter);
	invite(emitter);
	reaction(emitter);
	membership(emitter);
	powerLevels(emitter);
	typing(emitter);
}

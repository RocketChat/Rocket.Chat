import type { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures } from '@rocket.chat/homeserver';
import { ping } from './ping';
import { message } from './message';

export function registerEvents(emitter: Emitter<HomeserverEventSignatures>) {
    ping(emitter);
    message(emitter);
}
import type { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures } from '@rocket.chat/homeserver';
import { ping } from './ping';

export function registerEvents(emitter: Emitter<HomeserverEventSignatures>) {
    ping(emitter);
}
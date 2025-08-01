import type { MediaCallActor } from '@rocket.chat/core-typings';

export function compareActorsIgnoringSession(actor1: MediaCallActor, actor2: MediaCallActor): boolean {
	return actor1.type === actor2.type && actor1.id === actor2.id;
}

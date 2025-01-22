import type { IFreeSwitchEventUser } from '@rocket.chat/core-typings';

export function computeUserIdentifiers(identifiers: (IFreeSwitchEventUser | undefined)[]): IFreeSwitchEventUser[] {
	const newIdentifiers: IFreeSwitchEventUser[] = [];

	for (const id of identifiers) {
		if (!id || newIdentifiers.some((id2) => id2.type === id.type && id2.value === id.value)) {
			continue;
		}

		newIdentifiers.push(id);
	}

	const knownIdentifiers = newIdentifiers.filter((id) => id.type !== 'unknown');

	return knownIdentifiers.length ? knownIdentifiers : newIdentifiers;
}

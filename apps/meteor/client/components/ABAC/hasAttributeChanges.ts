import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';

const toComparable = (rows: IAbacAttributeDefinition[] = []) =>
	JSON.stringify(
		rows
			.filter(({ key }) => key)
			.map(({ key, values }) => [key, [...values].sort()])
			.sort(([a], [b]) => String(a).localeCompare(String(b))),
	);

export const hasAttributeChanges = (current: IAbacAttributeDefinition[] = [], initial: IAbacAttributeDefinition[] = []): boolean =>
	toComparable(current) !== toComparable(initial);

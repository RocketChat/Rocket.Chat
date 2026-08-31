import type { IAbacAttributeDefinition, IUser } from '@rocket.chat/core-typings';

import type { IEntityIdentifier } from '../../pdp/types';

export type EntityKeyType = 'emailAddress' | 'oidcIdentifier';

export function buildEntityIdentifier(defaultEntityKey: EntityKeyType, entityKey: string): IEntityIdentifier {
	if (defaultEntityKey === 'emailAddress') {
		return { emailAddress: entityKey };
	}
	return { id: entityKey };
}

export function getUserEntityKey(defaultEntityKey: EntityKeyType, user: Pick<IUser, '_id' | 'emails' | 'username'>): string | undefined {
	switch (defaultEntityKey) {
		case 'emailAddress':
			return user.emails?.find((email) => email.verified)?.address;
		case 'oidcIdentifier':
			return user.username;
	}
}

export function buildAttributeFqns(attributeNamespace: string, attributes: IAbacAttributeDefinition[]): string[] {
	if (!attributeNamespace) {
		throw new Error('Attribute namespace is not configured for VirtruPDP');
	}
	return attributes.flatMap((attr) => attr.values.map((value) => `https://${attributeNamespace}/attr/${attr.key}/value/${value}`));
}

const FQN_RE = /^https:\/\/[^/]+\/attr\/([^/]+)\/value\/(.+)$/;

export function parseAttributeFqns(fqns: string[]): { attributes: IAbacAttributeDefinition[]; malformed: string[] } {
	const grouped = new Map<string, Set<string>>();
	const malformed: string[] = [];
	for (const fqn of fqns) {
		const m = FQN_RE.exec(fqn);
		if (!m) {
			malformed.push(fqn);
			continue;
		}
		const [, key, value] = m;
		const bucket = grouped.get(key) ?? new Set<string>();
		bucket.add(value);
		grouped.set(key, bucket);
	}
	const attributes = [...grouped.entries()].map(([key, values]) => ({ key, values: [...values] }));
	return { attributes, malformed };
}

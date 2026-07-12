import type { CalendarMailboxIdentity, CalendarProviderType, CalendarUserIdentity } from './types';

export type ExplicitMailboxMapping = {
	userId: string;
	provider: CalendarProviderType;
	address: string;
	externalUserId?: string;
	tenantId?: string;
	enabled: boolean;
};

const normalizeAddress = (address: string): string => address.trim().toLocaleLowerCase('en-US');

export class MailboxResolver {
	constructor(private readonly mappings: ExplicitMailboxMapping[]) {}

	resolve(user: CalendarUserIdentity, defaultProvider: CalendarProviderType): CalendarMailboxIdentity | null {
		if (!user.active) return null;
		const explicit = this.mappings.filter((mapping) => mapping.userId === user.userId && mapping.enabled);
		if (explicit.length > 1) throw new Error('ambiguous-calendar-mailbox-mapping');
		if (explicit.length === 1) {
			const mapping = explicit[0];
			return {
				provider: mapping.provider,
				address: normalizeAddress(mapping.address),
				...(mapping.externalUserId && { externalUserId: mapping.externalUserId }),
				...(mapping.tenantId && { tenantId: mapping.tenantId }),
			};
		}

		if (user.trustedUpn) return { provider: user.providerHint ?? defaultProvider, address: normalizeAddress(user.trustedUpn) };
		const uniqueEmails = [...new Set(user.verifiedEmails.map(normalizeAddress))];
		if (uniqueEmails.length !== 1) return null;
		return { provider: user.providerHint ?? defaultProvider, address: uniqueEmails[0] };
	}

	validateNoDuplicates(): void {
		const seen = new Map<string, string>();
		for (const mapping of this.mappings.filter(({ enabled }) => enabled)) {
			const key = `${mapping.provider}:${normalizeAddress(mapping.address)}`;
			const owner = seen.get(key);
			if (owner && owner !== mapping.userId) throw new Error('calendar-mailbox-mapped-to-multiple-users');
			seen.set(key, mapping.userId);
		}
	}
}

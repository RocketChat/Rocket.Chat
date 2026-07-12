import { MailboxResolver } from './mailboxResolver';

describe('MailboxResolver', () => {
	it('uses an explicit mapping before trusted identities and persists provider selection', () => {
		const resolver = new MailboxResolver([
			{ userId: 'u1', provider: 'exchange-ews', address: 'Explicit@Example.COM', externalUserId: 'stable', enabled: true },
		]);
		expect(resolver.resolve({ userId: 'u1', active: true, trustedUpn: 'upn@example.com', verifiedEmails: [] }, 'microsoft-graph')).toEqual({
			provider: 'exchange-ews',
			address: 'explicit@example.com',
			externalUserId: 'stable',
		});
	});

	it('uses exactly one verified email and never guesses among ambiguous identities', () => {
		const resolver = new MailboxResolver([]);
		expect(resolver.resolve({ userId: 'u1', active: true, verifiedEmails: ['One@Example.com'] }, 'microsoft-graph')).toMatchObject({
			address: 'one@example.com',
		});
		expect(
			resolver.resolve({ userId: 'u2', active: true, verifiedEmails: ['one@example.com', 'two@example.com'] }, 'microsoft-graph'),
		).toBeNull();
	});

	it('rejects duplicate mailbox ownership', () => {
		const resolver = new MailboxResolver([
			{ userId: 'u1', provider: 'microsoft-graph', address: 'person@example.com', enabled: true },
			{ userId: 'u2', provider: 'microsoft-graph', address: 'PERSON@example.com', enabled: true },
		]);
		expect(() => resolver.validateNoDuplicates()).toThrow('calendar-mailbox-mapped-to-multiple-users');
	});
});

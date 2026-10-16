import { domainOfJid, toBareJid } from './jid';
import { createOrUpdateXMPPUser } from './xmppUser';
import { InvalidJidError } from '../../errors';

const upsertXMPPUser = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Users: { upsertXMPPUser: (...args: unknown[]) => upsertXMPPUser(...args) },
}));

describe('toBareJid', () => {
	it('strips the resource', () => {
		expect(toBareJid('alice@remote.tld/phone')).toBe('alice@remote.tld');
	});

	it('leaves a bare JID unchanged', () => {
		expect(toBareJid('alice@remote.tld')).toBe('alice@remote.tld');
	});
});

describe('domainOfJid', () => {
	it('extracts the domain from a full JID', () => {
		expect(domainOfJid('alice@remote.tld/phone')).toBe('remote.tld');
	});

	it('extracts the domain from a bare JID', () => {
		expect(domainOfJid('bob@conference.remote.tld')).toBe('conference.remote.tld');
	});
});

describe('createOrUpdateXMPPUser (addressing R9, R10)', () => {
	beforeEach(() => {
		upsertXMPPUser.mockReset().mockResolvedValue({ _id: 'u1' });
	});

	it('keeps one record per bare JID, whatever the resource', async () => {
		await createOrUpdateXMPPUser({ jid: 'alice@remote.tld/phone', name: 'ally' });

		expect(upsertXMPPUser).toHaveBeenCalledWith('alice@remote.tld', 'remote.tld', 'ally');
	});

	it('hands no name over when no nick is known', async () => {
		await createOrUpdateXMPPUser({ jid: 'alice@remote.tld' });

		expect(upsertXMPPUser).toHaveBeenCalledWith('alice@remote.tld', 'remote.tld', undefined);
	});

	it('refuses an address that is not `local@domain`, which could be a local username (addressing R11)', async () => {
		for (const jid of ['admin', 'admin/x#room@conference.remote.tld', '@remote.tld', 'admin@']) {
			await expect(createOrUpdateXMPPUser({ jid })).rejects.toThrow(InvalidJidError);
		}
		expect(upsertXMPPUser).not.toHaveBeenCalled();
	});
});

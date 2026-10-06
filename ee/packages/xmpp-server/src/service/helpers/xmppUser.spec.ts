import { domainOfJid, toBareJid } from './jid';
import { createOrUpdateXMPPUser } from './xmppUser';

const findOneAndUpdate = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Users: { findOneAndUpdate: (...args: unknown[]) => findOneAndUpdate(...args) },
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
		findOneAndUpdate.mockReset().mockResolvedValue({ _id: 'u1' });
	});

	const lastUpdate = () => findOneAndUpdate.mock.calls[0][1];

	it('keeps one record per bare JID, whatever the resource', async () => {
		await createOrUpdateXMPPUser({ jid: 'alice@remote.tld/phone', name: 'ally' });

		expect(findOneAndUpdate.mock.calls[0][0]).toEqual({ username: 'alice@remote.tld' });
	});

	it('renames the user to the nick they were last seen under', async () => {
		await createOrUpdateXMPPUser({ jid: 'alice@remote.tld', name: 'ally' });

		expect(lastUpdate().$set.name).toBe('ally');
		expect(lastUpdate().$setOnInsert).not.toHaveProperty('name');
	});

	it('names a new user by their JID and leaves an existing name alone when no nick is known', async () => {
		await createOrUpdateXMPPUser({ jid: 'alice@remote.tld' });

		expect(lastUpdate().$set).not.toHaveProperty('name');
		expect(lastUpdate().$setOnInsert.name).toBe('alice@remote.tld');
	});
});
